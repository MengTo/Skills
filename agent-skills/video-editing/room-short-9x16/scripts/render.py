# blender -b room.blend -P render.py -- '{"seq":"/abs/dir","n":287,"out":"/abs/out/####.png","frames":[1,1],"fill":[0.78,0.95],"side":[-0.25,0.1],"up":[0.03,0],"samples":64,"device":"METAL"}'
import bpy, json, sys, math, os
from mathutils import Vector
o = json.loads(sys.argv[sys.argv.index('--') + 1]); sc = bpy.context.scene
scr = bpy.data.objects['SCREEN']; bb = [scr.matrix_world @ Vector(c) for c in scr.bound_box]
P = sum(bb, Vector()) / 8; W = max(v.x for v in bb) - min(v.x for v in bb); N = Vector((0, -1, 0))
nt = scr.data.materials[0].node_tree; tex = nt.nodes['SEQ']
if o['seq'].endswith('.mp4'): img = bpy.data.images.load(o['seq']); img.source = 'MOVIE'
else: img = bpy.data.images.load(os.path.join(o['seq'], '0001.jpg')); img.source = 'SEQUENCE'
tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1, -1, 1); mp.inputs['Location'].default_value = (0, 1, 0)
nt.links.new(tc.outputs['UV'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], tex.inputs['Vector'])
tex.image = img; tex.image_user.frame_duration = o['n']; tex.image_user.frame_start = 1; tex.image_user.frame_offset = 0; tex.image_user.use_auto_refresh = True; tex.extension = 'EXTEND'
scr.data.materials[0].node_tree.nodes['EM'].inputs['Strength'].default_value = o.get('glow', 2.2)
cd = bpy.data.cameras.new('Cam'); cam = bpy.data.objects.new('Cam', cd); sc.collection.objects.link(cam); sc.camera = cam
cd.sensor_fit = 'VERTICAL'; cd.sensor_height = 36; cd.lens = o.get('lens', 70); cd.dof.use_dof = o.get('dof', True); cd.dof.aperture_fstop = o.get('fstop', 2.0); cd.clip_start = 0.05
sc.render.resolution_x = 1080; sc.render.resolution_y = 1920; sc.render.resolution_percentage = o.get('pct', 100); sc.render.fps = 60
fo = bpy.data.objects.new('Focus', None); sc.collection.objects.link(fo); fo.location = P; cd.dof.focus_object = fo
hfov = 2 * math.atan((36 * 1080 / 1920) / 2 / cd.lens)
n = o['n']; sc.frame_start = 1; sc.frame_end = n
def at(f):
    t = (f - 1) / max(1, n - 1); t = t * t * (3 - 2 * t); L = lambda a: a[0] + (a[1] - a[0]) * t
    fill = L(o.get('fill', [0.8, 0.95])); dist = (W / fill) / (2 * math.tan(hfov / 2))
    pos = P + N * dist + Vector((L(o.get('side', [0, 0])), 0, L(o.get('up', [0, 0])))); tgt = P + Vector((0, 0, L(o.get('ty', [-0.02, -0.02]))))
    cam.location = pos; cam.rotation_euler = (tgt - pos).to_track_quat('-Z', 'Y').to_euler();     cam.keyframe_insert('location', frame=f); cam.keyframe_insert('rotation_euler', frame=f)
for f in range(1, n + 1): at(f)
for L_ in bpy.data.lights:
    ob = bpy.data.objects.get(L_.name)
    if 'scale' in o: L_.energy *= o['scale']
sc.render.engine = 'CYCLES'; sc.cycles.samples = o.get('samples', 64); sc.cycles.use_denoising = True; sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.03
sc.cycles.max_bounces = 6; sc.render.use_persistent_data = True; sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'; sc.view_settings.exposure = o.get('exposure', 0)
dev = o.get('device', 'METAL'); prefs = bpy.context.preferences.addons['cycles'].preferences; prefs.compute_device_type = dev; prefs.get_devices()
for d in prefs.devices: d.use = True
sc.cycles.device = 'GPU'
if o.get('dn') == 'optix': sc.cycles.denoiser = 'OPTIX'  # OPTDN
if o.get('nodn'): sc.cycles.use_denoising = False
if 'bounces' in o: sc.cycles.max_bounces = o['bounces']
print('DENOISER', sc.cycles.denoiser, getattr(sc.cycles, 'denoising_use_gpu', None))
sc.render.image_settings.file_format = 'PNG' if o['out'].endswith('.png') else 'JPEG'; sc.render.image_settings.quality = 95; sc.render.filepath = o['out']
print('CAMDBG', tuple(round(v,3) for v in cam.location), tuple(round(v,3) for v in P), round(W,3), cd.dof.focus_object.name, [ (ob.name, tuple(round(v,2) for v in ob.location)) for ob in bpy.data.objects if ob.type=='LIGHT'][:3]);
a, b = o.get('frames', [1, n]); sc.frame_start = a; sc.frame_end = b; sc.frame_step = o.get('step', 1)
bpy.ops.render.render(animation=True)
