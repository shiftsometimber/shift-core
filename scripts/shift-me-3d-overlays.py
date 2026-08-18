from pathlib import Path
import trimesh
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public'/'shift-me-3d'/'overlays'
OUT.mkdir(parents=True,exist_ok=True)

DARK=np.array([23,22,20,255],dtype=np.uint8)
BLACK=np.array([12,16,14,255],dtype=np.uint8)
GREEN=np.array([83,108,86,255],dtype=np.uint8)


def paint(mesh, rgba):
    mesh.visual.vertex_colors=np.tile(rgba,(len(mesh.vertices),1))
    return mesh


def export_scene(name, meshes):
    scene=trimesh.Scene()
    for i,m in enumerate(meshes):
        scene.add_geometry(m,node_name=f'{name}-{i}')
    path=OUT/f'{name}.glb'
    path.write_bytes(scene.export(file_type='glb'))
    print(name,path.stat().st_size)

# Overlay coordinates are authored against the locked Anny/Shift proof body.
# These are deliberately first-pass modular assets: geometry, not CSS tricks.
# Head centre is roughly y=1.69 in the oriented proof coordinate system.

# HAIR
buzz=trimesh.creation.icosphere(subdivisions=2,radius=0.13)
buzz.apply_scale([0.88,0.50,0.98]);buzz.apply_translation([0,1.72,0])
export_scene('hair-buzz-cut',[paint(buzz,DARK)])

crew=trimesh.creation.icosphere(subdivisions=2,radius=0.145)
crew.apply_scale([0.90,0.56,0.98]);crew.apply_translation([0,1.735,0])
front=trimesh.creation.box(extents=[0.18,0.055,0.10]);front.apply_translation([0,1.79,0.055])
export_scene('hair-crew-cut',[paint(crew,DARK),paint(front,DARK)])

crop=trimesh.creation.icosphere(subdivisions=2,radius=0.15)
crop.apply_scale([0.92,0.58,1.0]);crop.apply_translation([0,1.74,0])
spikes=[]
for x in (-0.07,-0.035,0,0.035,0.07):
    s=trimesh.creation.box(extents=[0.034,0.055+0.02*(1-abs(x)/0.08),0.055])
    s.apply_translation([x,1.825,0.045])
    spikes.append(paint(s,DARK))
export_scene('hair-textured-crop',[paint(crop,DARK),*spikes])

# FACIAL HAIR
stubble=trimesh.creation.icosphere(subdivisions=2,radius=0.105)
stubble.apply_scale([0.78,0.45,0.52]);stubble.apply_translation([0,1.585,0.105])
export_scene('beard-heavy-stubble',[paint(stubble,np.array([38,35,31,255],dtype=np.uint8))])

short=trimesh.creation.icosphere(subdivisions=2,radius=0.12)
short.apply_scale([0.82,0.60,0.58]);short.apply_translation([0,1.555,0.105])
chin=trimesh.creation.icosphere(subdivisions=2,radius=0.075);chin.apply_scale([0.75,0.75,0.55]);chin.apply_translation([0,1.50,0.11])
export_scene('beard-short',[paint(short,DARK),paint(chin,DARK)])

full=trimesh.creation.icosphere(subdivisions=2,radius=0.135)
full.apply_scale([0.90,0.78,0.62]);full.apply_translation([0,1.525,0.10])
export_scene('beard-full',[paint(full,DARK)])

# KIT - garment shells intentionally sit outside the body and are split from it.
def tee(colour):
    torso=trimesh.creation.cylinder(radius=0.255,height=0.48,sections=32)
    torso.apply_scale([1.0,1.0,0.72]);torso.apply_transform(trimesh.transformations.rotation_matrix(np.pi/2,[1,0,0]));torso.apply_translation([0,1.20,0])
    sleeves=[]
    for side in (-1,1):
        sl=trimesh.creation.cylinder(radius=0.095,height=0.28,sections=20)
        sl.apply_transform(trimesh.transformations.rotation_matrix(np.pi/2,[0,1,0]));sl.apply_translation([side*0.27,1.31,0])
        sleeves.append(paint(sl,colour))
    return [paint(torso,colour),*sleeves]

export_scene('kit-shift-tee-black',tee(BLACK))
export_scene('kit-shift-tee-green',tee(GREEN))

hood=tee(BLACK)
hoodie=trimesh.creation.icosphere(subdivisions=2,radius=0.19);hoodie.apply_scale([0.95,0.75,0.75]);hoodie.apply_translation([0,1.43,-0.04])
export_scene('kit-shift-hoodie-black',[*hood,paint(hoodie,BLACK)])

manifest={
 'hair':{'Bald':None,'Buzz Cut':'hair-buzz-cut.glb','Crew Cut':'hair-crew-cut.glb','Textured Crop':'hair-textured-crop.glb'},
 'facial':{'Clean Shaven':None,'Heavy Stubble':'beard-heavy-stubble.glb','Short Beard':'beard-short.glb','Full Beard':'beard-full.glb'},
 'kit':{'Shift Tee — Black':'kit-shift-tee-black.glb','Shift Tee — Frome Ash Green':'kit-shift-tee-green.glb','Shift Hoodie — Black':'kit-shift-hoodie-black.glb'}
}
import json
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
