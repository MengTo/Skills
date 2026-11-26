# Render a clean background plate from a Blender scene for a talking shot: a new camera at eye height looking at the spot,
# a cinema lens with shallow depth of field focused where he will stand, the scene's own lights, nothing saved to the .blend.
# usage:
#   /Applications/Blender.app/Contents/MacOS/Blender -b scene.blend -P blender_plate.py -- \
#     --cam X,Y,Z --look X,Y,Z [--lens 35] [--focus 2.5] [--fstop 2.0] [--size 3840x2160] [--samples 128] \
#     [--engine CYCLES] [--hide "Name1,Name2"] [--out /abs/plate.png]
#   --cam: camera position (m, Blender Z up), e.g. 1.6 m above the floor where the viewer's eye would be.
#   --look: the point his face will be (eye height, 2-3 m in front of the camera); --focus defaults to that distance.
#   --hide: objects to leave out of the render (a character standing on the spot, UI planes, helpers).
# Also writes <out>-meta.json with the camera, lens and the brightest lights (direction from the spot), for the relight.
import bpy, sys, json, math, argparse
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--cam', required=True); ap.add_argument('--look', required=True)
ap.add_argument('--lens', type=float, default=35); ap.add_argument('--focus', type=float); ap.add_argument('--fstop', type=float, default=2.0)
ap.add_argument('--size', default='3840x2160'); ap.add_argument('--samples', type=int, default=128)
ap.add_argument('--engine', default='CYCLES'); ap.add_argument('--hide', default=''); ap.add_argument('--out', default='//plate.png')
a = ap.parse_args(argv)
sc = bpy.context.scene
cam_pos = Vector([float(v) for v in a.cam.split(',')]); look = Vector([float(v) for v in a.look.split(',')])
cd = bpy.data.cameras.new('PlateCam'); cd.lens = a.lens; cd.sensor_width = 36
cd.dof.use_dof = True; cd.dof.focus_distance = a.focus or (look - cam_pos).length; cd.dof.aperture_fstop = a.fstop
co = bpy.data.objects.new('PlateCam', cd); sc.collection.objects.link(co)
co.location = cam_pos; co.rotation_mode = 'QUATERNION'; co.rotation_quaternion = (look - cam_pos).to_track_quat('-Z', 'Y')
sc.camera = co
for n in [s.strip() for s in a.hide.split(',') if s.strip()]:
    o = bpy.data.objects.get(n)
    if o: o.hide_render = True
    else: print('[plate] no object named', n)
W, H = (int(v) for v in a.size.split('x'))
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = W, H, 100
sc.render.engine = a.engine
if a.engine == 'CYCLES':
    sc.cycles.samples = a.samples
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences; prefs.compute_device_type = 'METAL'; prefs.get_devices()
        for d in prefs.devices: d.use = True
        sc.cycles.device = 'GPU'
    except Exception as e: print('[plate] GPU not set, CPU render:', e)
    try: sc.cycles.use_denoising = True
    except Exception: pass
sc.render.image_settings.file_format = 'PNG'; sc.render.filepath = a.out
bpy.ops.render.render(write_still=True)
lights = []
for o in sc.objects:
    if o.type == 'LIGHT' and not o.hide_render:
        d = o.matrix_world.translation - look
        lights.append({'name': o.name, 'type': o.data.type, 'energy': getattr(o.data, 'energy', 0), 'color': list(o.data.color),
                       'from_spot': [round(v, 2) for v in d.normalized()], 'dist': round(d.length, 2)})
lights.sort(key=lambda l: -l['energy'])
json.dump({'cam': list(cam_pos), 'look': list(look), 'lens': a.lens, 'fstop': a.fstop, 'focus': cd.dof.focus_distance, 'size': [W, H],
           'lights': lights[:6]}, open(bpy.path.abspath(a.out).rsplit('.', 1)[0] + '-meta.json', 'w'), indent=1)
print('[plate] wrote', bpy.path.abspath(a.out))
