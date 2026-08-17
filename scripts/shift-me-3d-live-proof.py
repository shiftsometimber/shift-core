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
    'lean':{'weight':0.28,'muscle':0.38,'proportions':0.46},
    'average':{'weight':0.47,'muscle':0.45,'proportions':0.50},
    'athletic':{'weight':0.45,'muscle':0.76,'proportions':0.54},
    'broad':{'weight':0.68,'muscle':0.62,'proportions':0.66},
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

manifest={'engine':'Anny 0.6 / MakeHuman-derived CC0 assets','builds':{},'phenotype_labels':labels,'matched_keys':keys}
for name,tuning in builds.items():
    params={k:0.5 for k in labels}
    if keys['gender'] is not None: params[keys['gender']]=1.0
    if keys['age'] is not None: params[keys['age']]=0.50
    if keys['height'] is not None: params[keys['height']]=0.50
    for kind,value in tuning.items():
        key=keys.get(kind)
        if key is not None: params[key]=float(value)
    out=model(pose_parameters=pose,phenotype_kwargs=params)
    vertices=orient(out['vertices'].squeeze(0).detach().cpu().numpy())
    faces=np.asarray(model.faces)
    mesh=trimesh.Trimesh(vertices=vertices,faces=faces,process=False)
    mesh.visual.vertex_colors=np.tile(np.array([58,69,62,255],dtype=np.uint8),(len(vertices),1))
    path=OUT/f'{name}.glb'
    path.write_bytes(mesh.export(file_type='glb'))
    manifest['builds'][name]={'file':path.name,'params':{k:params[k] for k in labels if abs(float(params[k])-0.5)>1e-9}}
    print(name,path.stat().st_size)

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
    routes=(
      '    {"pattern": "shiftsometimber.co.uk/shift-me-3d-proof*","zone_name": "shiftsometimber.co.uk"},\n'
      '    {"pattern": "www.shiftsometimber.co.uk/shift-me-3d-proof*","zone_name": "shiftsometimber.co.uk"},\n'
    )
    if anchor not in text: raise RuntimeError('wrangler route anchor missing')
    text=text.replace(anchor,anchor+routes)
wrangler.write_text(text,encoding='utf-8')
