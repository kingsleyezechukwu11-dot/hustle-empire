# Flat brand-style app icons: one bold colour per tile, one geometric mark. {f} = mark colour, {b} = tile colour.
import json, sys
I = {
 'home': ('#ff6a00', '#141414', '<path d="M26 62 L60 30 L94 62 L80 62 L60 44 L40 62z"/><path d="M38 66 H82 V92 H66 V76 H54 V92 H38z"/>'),
 'furniture': ('#e8173f', '#ffffff', '<rect x="26" y="44" width="16" height="46" rx="3"/><rect x="78" y="44" width="16" height="46" rx="3"/><path d="M42 50 Q60 62 78 50 V64 Q60 74 42 64z"/><rect x="42" y="68" width="36" height="14"/>'),
 'grocery': ('#1aa7ff', '#ffffff', '<circle cx="60" cy="62" r="29" fill="none" stroke="{f}" stroke-width="7"/><path d="M48 36 Q42 62 48 88 M60 33 V91 M72 36 Q78 62 72 88" fill="none" stroke="{f}" stroke-width="5.5"/><path d="M33 62 H87" stroke="{f}" stroke-width="5.5"/>'),
 'chat': ('#19c940', '#4dffc3', '<path d="M28 34 H82 Q92 34 92 44 V62 Q92 72 82 72 H58 L42 86 V72 H38 Q28 72 28 62z"/><rect x="40" y="48" width="9" height="9" rx="4.5" fill="{b}"/><rect x="56" y="48" width="9" height="9" rx="4.5" fill="{b}"/><rect x="72" y="48" width="9" height="9" rx="4.5" fill="{b}"/>'),
 'school': ('#6a2bd9', '#ffffff', '<path d="M28 38 L57 46 V86 L28 78z"/><path d="M92 38 L63 46 V86 L92 78z"/>'),
 'work': ('#0a0a0a', '#ff5a1f', '<path d="M46 46 V36 H74 V46" fill="none" stroke="{f}" stroke-width="6"/><rect x="26" y="46" width="68" height="42" rx="6"/><rect x="26" y="62" width="68" height="5" fill="{b}"/><rect x="54" y="58" width="12" height="13" rx="2"/>'),
 'park': ('#8ff0a4', '#141414', '<rect x="30" y="32" width="38" height="24"/><rect x="30" y="56" width="16" height="32"/><circle cx="70" cy="76" r="12"/>'),
 'fun': ('#ffd000', '#1d3b2a', '<path d="M60 26 V46 M60 74 V94 M26 60 H46 M74 60 H94 M36 36 L50 50 M84 36 L70 50 M36 84 L50 70 M84 84 L70 70" fill="none" stroke="{f}" stroke-width="6.5" stroke-linecap="square"/>'),
 'gym': ('#ff3b3b', '#ffffff', '<rect x="22" y="44" width="14" height="32" rx="2"/><rect x="38" y="36" width="12" height="48" rx="2"/><rect x="70" y="36" width="12" height="48" rx="2"/><rect x="84" y="44" width="14" height="32" rx="2"/><rect x="50" y="55" width="20" height="10"/>'),
 'hospital': ('#0a0a0a', '#ffffff', '<path d="M51 30 H69 V51 H90 V69 H69 V90 H51 V69 H30 V51 H51z"/>'),
 'bank': ('#1650f0', '#eaf0ff', '<path d="M60 28 L94 46 H26z"/><path d="M30 52 H42 L38 86 H26z M54 52 H66 L62 86 H50z M78 52 H90 L86 86 H74z"/><rect x="24" y="88" width="72" height="6"/>'),
 'food': ('#ff6a00', '#ffe94d', '<path d="M26 60 H94 A34 34 0 0 1 26 60z"/><path d="M44 50 Q38 42 44 34 M60 50 Q54 42 60 34 M76 50 Q70 42 76 34" fill="none" stroke="{f}" stroke-width="5" stroke-linecap="round"/>'),
 'cinema': ('#16332a', '#b6f07a', '<rect x="26" y="38" width="68" height="44" rx="8" fill="none" stroke="{f}" stroke-width="7"/><path d="M53 48 L72 60 L53 72z"/>'),
 'salon': ('#a78bf0', '#3b1d6e', '<circle cx="40" cy="80" r="12" fill="none" stroke="{f}" stroke-width="7"/><circle cx="80" cy="80" r="12" fill="none" stroke="{f}" stroke-width="7"/><path d="M48 70 L82 28 L88 32 L56 74z M72 70 L38 28 L32 32 L64 74z"/>'),
 'bus': ('#1f6be0', '#4fd2ff', '<path d="M30 32 Q30 26 36 26 H84 Q90 26 90 32 V82 H30z"/><rect x="38" y="36" width="44" height="20" rx="3" fill="{b}"/><rect x="34" y="84" width="14" height="10" rx="2"/><rect x="72" y="84" width="14" height="10" rx="2"/>'),
 'swim': ('#1aa7ff', '#ffffff', '<path d="M22 50 L36 40 L50 50 L64 40 L78 50 L92 40 L98 46 L78 60 L64 50 L50 60 L36 50 L22 60z" transform="translate(0 0)"/><path d="M22 74 L36 64 L50 74 L64 64 L78 74 L92 64 L98 70 L78 84 L64 74 L50 84 L36 74 L22 84z"/>'),
 'library': ('#7445f5', '#1b0f4a', '<rect x="28" y="34" width="14" height="54"/><rect x="46" y="44" width="14" height="44"/><path d="M66 38 L78 34 L94 84 L82 88z"/>'),
 'beach': ('#ff5a1f', '#ffffff', '<circle cx="60" cy="60" r="14"/><path d="M60 24 V38 M60 82 V96 M24 60 H38 M82 60 H96 M35 35 L45 45 M85 35 L75 45 M35 85 L45 75 M85 85 L75 75" fill="none" stroke="{f}" stroke-width="7" stroke-linecap="round"/>'),
 'sports': ('#e0245e', '#4a0010', '<circle cx="60" cy="60" r="32"/><path d="M60 44 L75 55 L69 72 H51 L45 55z" fill="{b}"/><path d="M60 28 V44 M75 55 L91 50 M69 72 L79 87 M51 72 L41 87 M45 55 L29 50" fill="none" stroke="{b}" stroke-width="4"/>'),
 'hotel': ('#0a0a0a', '#5ce8b0', '<rect x="26" y="34" width="10" height="56"/><rect x="36" y="62" width="58" height="16"/><rect x="40" y="50" width="20" height="12" rx="3"/><rect x="86" y="78" width="8" height="12"/>'),
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
