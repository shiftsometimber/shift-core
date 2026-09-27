from pathlib import Path
import json
import numpy as np
import torch
import trimesh
import anny

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public'/'shift-me-3d'
OUT.mkdir(parents=True,exist_ok=True)

model=anny.Anny().to(dtype=torch.float32)
pose=torch.eye(4,dtype=torch.float32)[None,None].repeat(1,model.bone_count,1,1)
labels=list(model.phenotype_labels)
print('Anny phenotype labels:',labels)

def find_key(*needles):
    needles=[n.lower() for n in needles]
    for key in labels:
        lk=key.lower()
        if any(n==lk or n in lk for n in needles):
            return key
    return None

keys={
    'gender':find_key('gender','sex'),
    'age':find_key('age'),
    'weight':find_key('weight'),
    'muscle':find_key('muscle'),
    'height':find_key('height'),
    'proportions':find_key('proportion')
}
print('Matched phenotype keys:',keys)

# Deliberately wide visual range for Shift's likely starting audience.
# The labels are UX labels, not claims about exact body weight or BMI.
builds={
    'average':{'weight':0.48,'muscle':0.34,'proportions':0.50,'breadth':0.00,'mass':0.00,'visual_note':'baseline ordinary male'},
    'solid':{'weight':0.64,'muscle':0.43,'proportions':0.62,'breadth':0.060,'mass':0.045,'visual_note':'clearly broader shoulders, chest and limbs'},
    'stocky':{'weight':0.76,'muscle':0.39,'proportions':0.72,'breadth':0.095,'mass':0.090,'visual_note':'shorter-looking, thicker all-round build'},
    'bigger-bloke':{'weight':0.88,'muscle':0.30,'proportions':0.68,'breadth':0.130,'mass':0.145,'visual_note':'visibly overweight before stomach choice'},
    'heavy':{'weight':0.97,'muscle':0.24,'proportions':0.64,'breadth':0.175,'mass':0.220,'visual_note':'substantially heavy build'},
    'very-heavy':{'weight':1.00,'muscle':0.20,'proportions':0.60,'breadth':0.230,'mass':0.320,'visual_note':'very large build; intended to reach roughly 25-stone visual territory depending on height'},
}

stomachs={
    'flat':{'belly':0.00,'waist':0.00},
    'dad-bod':{'belly':0.11,'waist':0.045},
    'beer-belly':{'belly':0.24,'waist':0.075},
}

def orient(vertices):
    v=np.asarray(vertices,dtype=np.float64).copy()
    ext=np.ptp(v,axis=0)
    vertical=int(np.argmax(ext))
    if vertical==2:
        v=np.column_stack([v[:,0],v[:,2],-v[:,1]])
    elif vertical==0:
        v=np.column_stack([v[:,1],v[:,0],v[:,2]])
    v[:,0]-=(v[:,0].min()+v[:,0].max())/2
    v[:,2]-=(v[:,2].min()+v[:,2].max())/2
    v[:,1]-=v[:,1].min()
    return v

def shorten_arms(vertices, amount=0.085):
    """Shorten the T-pose arm span without altering shoulders or body width.

    The Anny base is proportionally a little long-armed for the approved Shift
    bloke. Only vertices in the upper-body arm band and beyond the shoulder
    anchor are pulled inward. Build and stomach geometry remain untouched.
    """
    v=np.asarray(vertices,dtype=np.float64).copy()
    h=max(float(v[:,1].max()-v[:,1].min()),1e-6)
    t=(v[:,1]-v[:,1].min())/h
    absx=np.abs(v[:,0])
    maxx=max(float(absx.max()),1e-6)
    shoulder_anchor=maxx*0.43
    excess=np.clip((absx-shoulder_anchor)/(maxx-shoulder_anchor+1e-9),0.0,1.0)
    arm_band=np.exp(-((t-0.665)/0.145)**2)
    strength=amount*excess*arm_band
    new_abs=np.where(absx>shoulder_anchor,shoulder_anchor+(absx-shoulder_anchor)*(1.0-strength),absx)
    v[:,0]=np.sign(v[:,0])*new_abs
    return v

def shift_male_shape(vertices,breadth=0.0,mass=0.0,belly=0.0,waist=0.0):
    v=np.asarray(vertices,dtype=np.float64).copy()
    h=max(float(v[:,1].max()-v[:,1].min()),1e-6)
    t=(v[:,1]-v[:,1].min())/h
    body_width=max(float(np.ptp(v[:,0])),1e-6)
    body_depth=max(float(np.ptp(v[:,2])),1e-6)

    # Overall build separation. These masks deliberately avoid simply scaling
    # the whole avatar and instead add mass through torso, upper arms and thighs.
    shoulders=np.exp(-((t-0.73)/0.095)**2)
    chest=np.exp(-((t-0.65)/0.105)**2)
    waist_band=np.exp(-((t-0.555)/0.105)**2)
    upper_leg=np.exp(-((t-0.31)/0.115)**2)
    upper_arm=np.exp(-((t-0.57)/0.19)**2)

    v[:,0]*=(1.0 + breadth*(0.95*shoulders+0.55*chest+0.30*upper_arm+0.34*upper_leg))
    if mass:
        v[:,0]*=(1.0 + mass*(0.38*chest+0.46*waist_band+0.34*upper_leg))
        v[:,2]*=(1.0 + mass*(0.30*chest+0.52*waist_band+0.22*upper_leg))

    # Stomach is intentionally centred above the hip/thigh region. Earlier
    # tuning was too low and made thighs grow. Dad Bod softens the waist;
    # Beer Belly projects the central/lower abdomen forwards.
    abdomen=np.exp(-((t-0.565)/0.070)**2)
    lower_abdomen=np.exp(-((t-0.515)/0.065)**2)
    hip_guard=np.clip((t-0.43)/0.07,0.0,1.0)
    abdomen*=hip_guard
    lower_abdomen*=hip_guard

    if waist:
        v[:,0]*=(1.0 + waist*(0.70*abdomen+0.42*lower_abdomen))
        v[:,2]*=(1.0 + waist*(0.32*abdomen+0.28*lower_abdomen))

    if belly:
        frontness=np.clip((v[:,2]/(body_depth*0.5)+1.0)/2.0,0.0,1.0)
        centre=np.clip(1.0-np.abs(v[:,0])/(body_width*0.56),0.0,1.0)
        stomach_mask=(0.76*abdomen+0.58*lower_abdomen)*hip_guard*centre
        forward=belly*body_depth*stomach_mask*(0.20+0.80*frontness)
        v[:,2]+=forward
        v[:,0]*=(1.0 + belly*0.11*stomach_mask)

    # Arm correction is applied last so body/stomach tuning cannot re-lengthen
    # the limbs. It only changes distal arm span in the T-pose.
    v=shorten_arms(v)

    v[:,0]-=(v[:,0].min()+v[:,0].max())/2
    v[:,2]-=(v[:,2].min()+v[:,2].max())/2
    v[:,1]-=v[:,1].min()
    return v

manifest={
    'engine':'Anny 0.6 / MakeHuman-derived CC0 assets',
    'purpose':'Shift Me adult male body + independent stomach proof',
    'builds':{},
    'stomachs':stomachs,
    'variants':{},
    'phenotype_labels':labels,
    'matched_keys':keys,
    'notes':{
        'very-heavy':'visual target is a genuinely very large male, roughly 25-stone territory depending on height; not an exact weight simulator',
        'arm-proportion':'distal T-pose arm span shortened by 8.5% while preserving shoulder width'
    }
}

for old in OUT.glob('*.glb'):
    old.unlink()
faces=np.asarray(model.faces)

for build_name,tuning in builds.items():
    params={k:0.5 for k in labels}
    if keys['gender'] is not None: params[keys['gender']]=0.0  # Anny: 0 = male, 1 = female
    if keys['age'] is not None: params[keys['age']]=0.60
    if keys['height'] is not None: params[keys['height']]=0.50
    for kind in ('weight','muscle','proportions'):
        key=keys.get(kind)
        if key is not None: params[key]=float(tuning[kind])
    out=model(pose_parameters=pose,phenotype_kwargs=params)
    base=orient(out['vertices'].squeeze(0).detach().cpu().numpy())
    manifest['builds'][build_name]={
        'params':{k:params[k] for k in labels if abs(float(params[k])-0.5)>1e-9},
        'breadth':tuning['breadth'],
        'mass':tuning['mass'],
        'visual_note':tuning['visual_note']
    }
    for stomach_name,stomach in stomachs.items():
        vertices=shift_male_shape(base,tuning['breadth'],tuning['mass'],stomach['belly'],stomach['waist'])
        mesh=trimesh.Trimesh(vertices=vertices,faces=faces,process=False)
        mesh.visual.vertex_colors=np.tile(np.array([28,42,35,255],dtype=np.uint8),(len(vertices),1))
        filename=f'{build_name}-{stomach_name}.glb'
        path=OUT/filename
        path.write_bytes(mesh.export(file_type='glb'))
        manifest['variants'][f'{build_name}:{stomach_name}']={'file':filename,'build':build_name,'stomach':stomach_name}
        print(build_name,stomach_name,path.stat().st_size)

(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')

worker=ROOT/'worker-entry-v6.js'
text=worker.read_text(encoding='utf-8')
imp="import {shiftMe3DProofRoutes} from './shift-me-3d-proof-v1.js';\n"
if imp not in text:
    anchor="import {shiftMeRoutes} from './shift-me-v1.js';\n"
    if anchor not in text: raise RuntimeError('worker import anchor missing')
    text=text.replace(anchor,anchor+imp)
route="    const shiftMe3DProof=await shiftMe3DProofRoutes(request);if(shiftMe3DProof)return shiftMe3DProof;\n"
if route not in text:
    anchor="    const gitAsset=await gitMemberAsset(path,env);if(gitAsset)return gitAsset;\n"
    if anchor not in text: raise RuntimeError('worker route anchor missing')
    text=text.replace(anchor,route+anchor)
worker.write_text(text,encoding='utf-8')

wrangler=ROOT/'wrangler.jsonc'
text=wrangler.read_text(encoding='utf-8')
if 'shiftsometimber.co.uk/shift-me-3d-proof*' not in text:
    anchor='    {"pattern": "api.shiftsometimber.co.uk","custom_domain": true},\n'
    routes=('    {"pattern": "shiftsometimber.co.uk/shift-me-3d-proof*","zone_name": "shiftsometimber.co.uk"},\n' '    {"pattern": "www.shiftsometimber.co.uk/shift-me-3d-proof*","zone_name": "shiftsometimber.co.uk"},\n')
    if anchor not in text: raise RuntimeError('wrangler route anchor missing')
    text=text.replace(anchor,anchor+routes)
wrangler.write_text(text,encoding='utf-8')
