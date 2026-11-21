# Flat brand-style app icons: one bold colour per tile, one geometric mark. {f} = mark colour, {b} = tile colour.
import json, sys
I = {
 'home': ('#ff6a00', '#141414', '<path d="M32 90 V60 Q32 52 39 47 L55 35 Q60 31 65 35 L81 47 Q88 52 88 60 V90" fill="none" stroke="{f}" stroke-linecap="round" stroke-linejoin="round" stroke-width="12"/><path d="M52 90 V76 Q52 68 60 68 Q68 68 68 76 V90" fill="none" stroke="{f}" stroke-linecap="round" stroke-linejoin="round" stroke-width="10"/>'),
 'furniture': ('#e8173f', '#ffffff', '<path d="M30 52 Q30 38 44 38 H76 Q90 38 90 52 V58 Q100 58 100 70 V80 Q100 90 90 90 H30 Q20 90 20 80 V70 Q20 58 30 58z"/><path d="M34 64 Q60 76 86 64" fill="none" stroke="{b}" stroke-width="6" stroke-linecap="round"/>'),
 'grocery': ('#1aa7ff', '#ffffff', '<path d="M44 46 Q44 28 60 28 Q76 28 76 46" fill="none" stroke="{f}" stroke-linecap="round" stroke-linejoin="round" stroke-width="8"/><path d="M28 48 H92 Q96 48 95 53 L88 86 Q86 94 78 94 H42 Q34 94 32 86 L25 53 Q24 48 28 48z"/><path d="M48 66 Q60 78 72 66" fill="none" stroke="{b}" stroke-width="6" stroke-linecap="round"/>'),
 'chat': ('#19c940', '#4dffc3', '<path d="M60 26 C82 26 96 40 96 58 C96 76 82 88 62 88 C56 88 51 87 46 85 L30 94 L34 78 C27 72 24 65 24 58 C24 40 38 26 60 26z"/><circle cx="44" cy="58" r="5.500" fill="{b}"/><circle cx="60" cy="58" r="5.500" fill="{b}"/><circle cx="76" cy="58" r="5.500" fill="{b}"/>'),
 'school': ('#6a2bd9', '#ffffff', '<path d="M58 44 C48 36 34 34 22 38 V84 C34 80 48 82 58 90z"/><path d="M62 44 C72 36 86 34 98 38 V84 C86 80 72 82 62 90z"/>'),
 'work': ('#0a0a0a', '#ff5a1f', '<path d="M46 44 V38 Q46 32 52 32 H68 Q74 32 74 38 V44" fill="none" stroke="{f}" stroke-linecap="round" stroke-linejoin="round" stroke-width="7"/><rect x="24" y="44" width="72" height="46" rx="14"/><path d="M24 64 Q60 74 96 64" fill="none" stroke="{b}" stroke-width="5"/>'),
 'park': ('#8ff0a4', '#141414', '<path d="M60 22 C82 36 90 58 74 76 C68 82 62 84 60 84 C58 84 52 82 46 76 C30 58 38 36 60 22z"/><path d="M60 84 V98 M60 66 Q50 58 52 46" fill="none" stroke="{f}" stroke-width="5" stroke-linecap="round"/><path d="M60 66 Q50 58 52 46" fill="none" stroke="{b}" stroke-width="5" stroke-linecap="round"/>'),
 'fun': ('#ffd000', '#1d3b2a', '<path d="M60 20 C63 48 72 57 100 60 C72 63 63 72 60 100 C57 72 48 63 20 60 C48 57 57 48 60 20z"/>'),
 'gym': ('#ff3b3b', '#ffffff', '<path d="M28 46 V74 M40 38 V82 M80 38 V82 M92 46 V74" fill="none" stroke="{f}" stroke-linecap="round" stroke-linejoin="round" stroke-width="11"/><path d="M40 60 H80" fill="none" stroke="{f}" stroke-linecap="round" stroke-linejoin="round" stroke-width="8"/>'),
 'hospital': ('#0a0a0a', '#ffffff', '<path d="M60 32 V88 M32 60 H88" fill="none" stroke="{f}" stroke-linecap="round" stroke-linejoin="round" stroke-width="20"/>'),
 'bank': ('#1650f0', '#eaf0ff', '<circle cx="60" cy="60" r="32" fill="none" stroke="{f}" stroke-linecap="round" stroke-linejoin="round" stroke-width="8"/><path d="M72 46 Q66 40 58 41 Q46 42 47 51 Q48 58 60 60 Q73 62 73 70 Q73 79 61 79 Q51 79 47 73" fill="none" stroke="{f}" stroke-linecap="round" stroke-linejoin="round" stroke-width="7"/>'),
 'food': ('#ff6a00', '#ffe94d', '<path d="M22 58 H98 C98 80 82 94 60 94 C38 94 22 80 22 58z"/><path d="M44 48 C38 42 48 36 42 28 M60 48 C54 42 64 36 58 28 M76 48 C70 42 80 36 74 28" fill="none" stroke="{f}" stroke-width="5" stroke-linecap="round"/>'),
 'cinema': ('#16332a', '#b6f07a', '<rect x="24" y="30" width="72" height="60" rx="20" fill="none" stroke="{f}" stroke-linecap="round" stroke-linejoin="round" stroke-width="7"/><path d="M52 47 Q52 44 55 45.500 L72 57 Q75 60 72 62.500 L55 74.500 Q52 76 52 73z" stroke="{f}" stroke-width="4" stroke-linejoin="round"/>'),
 'salon': ('#a78bf0', '#3b1d6e', '<circle cx="40" cy="80" r="12" fill="none" stroke="{f}" stroke-linecap="round" stroke-linejoin="round" stroke-width="7"/><circle cx="80" cy="80" r="12" fill="none" stroke="{f}" stroke-linecap="round" stroke-linejoin="round" stroke-width="7"/><path d="M48 71 C58 58 70 44 84 26 M72 71 C62 58 50 44 36 26" fill="none" stroke="{f}" stroke-linecap="round" stroke-linejoin="round" stroke-width="7"/>'),
 'bus': ('#1f6be0', '#4fd2ff', '<rect x="26" y="24" width="68" height="62" rx="18"/><rect x="36" y="34" width="48" height="22" rx="10" fill="{b}"/><circle cx="42" cy="72" r="5" fill="{b}"/><circle cx="78" cy="72" r="5" fill="{b}"/><rect x="34" y="84" width="14" height="12" rx="6"/><rect x="72" y="84" width="14" height="12" rx="6"/>'),
 'swim': ('#1aa7ff', '#ffffff', '<path d="M20 52 C30 42 40 42 50 52 S70 62 80 52 S96 44 100 48" fill="none" stroke="{f}" stroke-linecap="round" stroke-linejoin="round" stroke-width="10"/><path d="M20 76 C30 66 40 66 50 76 S70 86 80 76 S96 68 100 72" fill="none" stroke="{f}" stroke-linecap="round" stroke-linejoin="round" stroke-width="10"/>'),
 'library': ('#7445f5', '#1b0f4a', '<path d="M30 30 H52 Q58 30 58 36 V92 Q50 84 30 86z"/><path d="M90 30 H68 Q62 30 62 36 V92 Q70 84 90 86z"/><path d="M76 30 V50 L81 45 L86 50 V30z" fill="{b}"/>'),
 'beach': ('#ff5a1f', '#ffffff', '<circle cx="60" cy="48" r="18"/><path d="M18 82 C32 70 46 70 60 82 S88 94 102 82" fill="none" stroke="{f}" stroke-linecap="round" stroke-linejoin="round" stroke-width="9"/>'),
 'sports': ('#e0245e', '#4a0010', '<circle cx="60" cy="60" r="34"/><path d="M28 50 C46 56 54 72 50 92 M92 70 C74 64 66 48 70 28" fill="none" stroke="{b}" stroke-width="6" stroke-linecap="round"/>'),
 'hotel': ('#0a0a0a', '#5ce8b0', '<path d="M72 26 C52 30 40 48 44 66 C48 84 66 96 84 92 C70 88 60 76 60 60 C60 44 66 32 72 26z"/><path d="M76 40 H90 L76 56 H90" fill="none" stroke="{f}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'),
}
ORDER = list(I)
def icon(k):
  b, f, mark = I[k]
  return (f'<svg viewBox="0 0 120 120" aria-hidden="true"><rect width="120" height="120" rx="27" fill="{b}"/>'
          f'<g fill="{f}">{mark.replace("{f}", f).replace("{b}", b)}</g></svg>')
out = {k: icon(k) for k in ORDER}
open(sys.argv[1], 'w').write('// The places menu: flat brand-style app icons, one bold colour and one geometric mark each, drawn for the game.\nexport const FLAT_ICONS = ' + json.dumps(out) + ';\n')
if len(sys.argv) > 2:
  open(sys.argv[2], 'w').write('<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:34px;width:720px;background:#fff;display:grid;grid-template-columns:repeat(5,1fr);gap:28px}div{display:flex;flex-direction:column;align-items:center;gap:7px;font:600 13px -apple-system,sans-serif;color:#222}svg{width:116px;height:116px}</style>' + ''.join(f'<div>{out[k]}<span>{k}</span></div>' for k in ORDER))
print('ok')
