# blender -b -P build.py : room.glb -> room.blend (Z-up), lights from room-lights.json, the SCREEN mesh given an emission material
import bpy, json, math, os
from mathutils import Vector
here = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(here, 'room.glb'))
T = lambda p: Vector((p[0], -p[2], p[1]))
def col(h, white=0.75):
    r, g, b = ((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255
    lin = lambda c: c ** 2.2
    w = (0.93, 0.95, 1.0); return tuple(lin(c) * (1 - white) + w[i] * white for i, c in enumerate((r, g, b)))
for i, L in enumerate(json.load(open(os.path.join(here, 'room-lights.json')))):
    if L['type'] not in ('SpotLight', 'PointLight') or L['i'] < 0.2: continue
    kind = 'SPOT' if L['type'] == 'SpotLight' else 'POINT'
    d = bpy.data.lights.new(f'L{i}', kind); o = bpy.data.objects.new(f'L{i}', d); bpy.context.scene.collection.objects.link(o)
    o.location = T(L['pos']); d.color = col(L['color']); d.energy = L['i'] * (9 if kind == 'SPOT' else 5); d.shadow_soft_size = 0.06
    o['three_i'] = L['i']
    if kind == 'SPOT':
        d.spot_size = min(math.radians(170), 2 * (L.get('angle') or 0.8)); d.spot_blend = 0.6
        v = T(L['tgt']) - o.location; o.rotation_euler = v.to_track_quat('-Z', 'Y').to_euler()
scr = bpy.data.objects.get('SCREEN'); print('SCREEN', scr is not None, scr.location if scr else None)
m = bpy.data.materials.new('ScreenEmit'); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
tex = nt.nodes.new('ShaderNodeTexImage'); tex.name = 'SEQ'; em = nt.nodes.new('ShaderNodeEmission'); em.name = 'EM'; em.inputs['Strength'].default_value = 2.2
out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(tex.outputs['Color'], em.inputs['Color']); nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
scr.data.materials.clear(); scr.data.materials.append(m)
w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.012, 0.014, 0.02, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 1
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(here, 'room.blend'), compress=True)
print('saved', len(bpy.data.objects), 'objects')
