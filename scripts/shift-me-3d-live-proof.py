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

builds={
    'average':{'weight':0.52,'muscle':0.40,'proportions':0.55,'breadth':0.00},
    'solid':{'weight':0.62,'muscle':0.48,'proportions':0.62,'breadth':0.025},
    'stocky':{'weight':0.72,'muscle':0.44,'proportions':0.70,'breadth':0.045},
    'bigger-bloke':{'weight':0.82,'muscle':0.36,'proportions':0.69,'breadth':0.060},
    'heavy':{'weight':0.91,'muscle':0.30,'proportions':0.66,'breadth':0.078},
    'very-heavy':{'weight':0.99,'muscle':0.25,'proportions':0.64,'breadth':0.095},
}

stomachs={
    'flat':{'belly':0.00,'waist':0.00},
    'dad-bod':{'belly':0.075,'waist':0.025},
    'beer-belly':{'belly':0.155,'waist':0.050},
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

def shift_male_shape(vertices,breadth=0.0,belly=0.0,waist=0.0):
    v=np.asarray(vertices,dtype=np.float64).copy()
    h=max(float(v[:,1].max()-v[:,1].min()),1e-6)
    t=(v[:,1]-v[:,1].min())/h
    body_depth=max(float(np.ptp(v[:,2])),1e-6)
    shoulder=np.exp(-((t-0.70)/0.115)**2)
    torso=np.exp(-((t-0.57)/0.20)**2)
    v[:,0]*=(1.0 + breadth*(0.35*torso+0.85*shoulder))
    mid=np.exp(-((t-0.49)/0.105)**2)
    lower=np.exp(-((t-0.43)/0.12)**2)
    if waist:
        v[:,0]*=(1.0 + waist*(0.45*mid+0.55*lower))
        v[:,2]*=(1.0 + waist*(0.30*mid+0.35*lower))
    if belly:
        front_weight=np.clip((v[:,2]/(body_depth*0.5)+1.0)/2.0,0.0,1.0)
        v[:,2]+=belly*body_depth*(0.72*mid+0.48*lower)*(0.28+0.72*front_weight)
        v[:,0]*=(1.0 + belly*0.18*(0.65*mid+0.35*lower))
    v[:,0]-=(v[:,0].min()+v[:,0].max())/2
    v[:,2]-=(v[:,2].min()+v[:,2].max())/2
    v[:,1]-=v[:,1].min()
    return v

manifest={'engine':'Anny 0.6 / MakeHuman-derived CC0 assets','purpose':'Shift Me adult male body + independent stomach proof','builds':{},'stomachs':stomachs,'variants':{},'phenotype_labels':labels,'matched_keys':keys}
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
    manifest['builds'][build_name]={'params':{k:params[k] for k in labels if abs(float(params[k])-0.5)>1e-9},'breadth':tuning['breadth']}
    for stomach_name,stomach in stomachs.items():
        vertices=shift_male_shape(base,tuning['breadth'],stomach['belly'],stomach['waist'])
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
