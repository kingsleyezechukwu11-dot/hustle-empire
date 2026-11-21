# Packs a downloaded scene.gltf (+ .bin + textures) into one small .glb: only colour textures are kept, shrunk to <= SIZE px.
import json, struct, sys, os, io
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]; SIZE = int(sys.argv[3]) if len(sys.argv) > 3 else 512
base = os.path.dirname(src); J = json.load(open(src)); BIN = bytearray(open(os.path.join(base, J['buffers'][0]['uri']), 'rb').read())
keep = set()
for m in J.get('materials', []):
  for k in ['normalTexture', 'occlusionTexture', 'emissiveTexture']: m.pop(k, None)
  pbr = m.get('pbrMetallicRoughness', {}); pbr.pop('metallicRoughnessTexture', None)
  if 'baseColorTexture' in pbr: keep.add(J['textures'][pbr['baseColorTexture']['index']]['source'])
  m.pop('extensions', None)
for i, im in enumerate(J.get('images', [])):
  if i not in keep or 'uri' not in im: im.pop('uri', None); continue
  img = Image.open(os.path.join(base, im.pop('uri'))); img.thumbnail((SIZE, SIZE))
  alpha = img.mode in ('RGBA', 'LA') and img.getextrema()[-1][0] < 255
  b = io.BytesIO(); (img.convert('RGBA').save(b, 'PNG') if alpha else img.convert('RGB').save(b, 'JPEG', quality=85))
  while len(BIN) % 4: BIN.append(0)
  J['bufferViews'].append({'buffer': 0, 'byteOffset': len(BIN), 'byteLength': len(b.getvalue())}); BIN += b.getvalue()
  im['bufferView'] = len(J['bufferViews']) - 1; im['mimeType'] = 'image/png' if alpha else 'image/jpeg'
J.pop('extensionsUsed', None); J.pop('extensionsRequired', None)
while len(BIN) % 4: BIN.append(0)
J['buffers'] = [{'byteLength': len(BIN)}]
js = json.dumps(J).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(BIN)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(BIN), 0x004E4942) + BIN
open(dst, 'wb').write(out); print(dst, len(out) // 1024, 'KB')
