import json, sys
sys.path.insert(0, '.')
from icons import ICONS as BASE
# role: p solid glass, s soft glass, a mid glass, k a cut-out in the background colour
SH = {
 'home': BASE['home']['shapes'], 'grocery': BASE['grocery']['shapes'], 'chat': BASE['chat']['shapes'], 'gym': BASE['gym']['shapes'],
 'furniture': [('<rect x="27" y="38" width="66" height="30" rx="9"/>', 's'), ('<rect x="15" y="52" width="16" height="32" rx="7"/><rect x="89" y="52" width="16" height="32" rx="7"/>', 'a'), ('<rect x="27" y="62" width="66" height="20" rx="6"/>', 'p'), ('<rect x="24" y="84" width="6" height="9" rx="2"/><rect x="90" y="84" width="6" height="9" rx="2"/>', 's')],
 'work': [('<path d="M46 44 v-7 a6 6 0 0 1 6 -6 h16 a6 6 0 0 1 6 6 v7" fill="none" stroke-width="6"/>', 's'), ('<rect x="20" y="42" width="80" height="52" rx="10"/>', 'p'), ('<rect x="20" y="60" width="80" height="6"/>', 'k'), ('<rect x="52" y="56" width="16" height="14" rx="3"/>', 'a')],
 'school': [('<path d="M36 60 v14 q24 14 48 0 v-14 l-24 10z"/>', 's'), ('<path d="M60 30 L104 50 L60 70 L16 50z"/>', 'p'), ('<path d="M90 56 v18" fill="none" stroke-width="3.500" stroke-linecap="round"/><circle cx="90" cy="78" r="5"/>', 'a')],
 'park': [('<rect x="10" y="92" width="100" height="30" rx="4"/>', 's'), ('<rect x="55" y="62" width="10" height="34" rx="4"/>', 'a'), ('<circle cx="60" cy="44" r="22"/>', 's'), ('<circle cx="44" cy="56" r="16"/><circle cx="76" cy="56" r="16"/><circle cx="60" cy="38" r="17"/>', 'p')],
 'fun': [('<circle cx="56" cy="64" r="32"/>', 'p'), ('<circle cx="56" cy="64" r="22"/>', 'k'), ('<circle cx="56" cy="64" r="13"/>', 'p'), ('<circle cx="56" cy="64" r="5"/>', 'k'), ('<path d="M56 64 L94 26" fill="none" stroke-width="5" stroke-linecap="round"/><path d="M86 22 l12 0 l0 12 z"/>', 'a')],
 'hospital': [('<rect x="22" y="22" width="76" height="76" rx="18"/>', 's'), ('<rect x="51" y="34" width="18" height="52" rx="4"/><rect x="34" y="51" width="52" height="18" rx="4"/>', 'p')],
 'bank': [('<path d="M60 22 L100 44 H20z"/>', 'p'), ('<rect x="24" y="48" width="72" height="6" rx="2"/>', 'a'), ('<rect x="28" y="56" width="10" height="28" rx="2"/><rect x="45" y="56" width="10" height="28" rx="2"/><rect x="65" y="56" width="10" height="28" rx="2"/><rect x="82" y="56" width="10" height="28" rx="2"/>', 's'), ('<rect x="18" y="86" width="84" height="10" rx="3"/>', 'p')],
 'food': [('<circle cx="60" cy="62" r="28"/>', 's'), ('<circle cx="60" cy="62" r="18"/>', 'p'), ('<path d="M20 34 v18 a6 6 0 0 0 12 0 v-18 M26 34 v58" fill="none" stroke-width="4" stroke-linecap="round"/>', 'a'), ('<path d="M98 34 q-12 8 -10 30 h8 v28" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>', 'a')],
 'cinema': [('<path d="M24 42 L92 26 L96 40 L28 56z"/>', 's'), ('<rect x="24" y="54" width="72" height="42" rx="7"/>', 'p'), ('<path d="M40 54 l-8 12 M58 54 l-8 12 M76 54 l-8 12 M94 54 l-8 12" stroke-width="6" fill="none"/>', 'k')],
 'salon': [('<path d="M46 74 L84 22 M74 74 L36 22" fill="none" stroke-width="7" stroke-linecap="round"/>', 'p'), ('<circle cx="42" cy="86" r="13" fill="none" stroke-width="7"/><circle cx="78" cy="86" r="13" fill="none" stroke-width="7"/>', 'a')],
 'bus': [('<rect x="34" y="90" width="12" height="10" rx="3"/><rect x="74" y="90" width="12" height="10" rx="3"/>', 's'), ('<rect x="24" y="22" width="72" height="72" rx="14"/>', 'p'), ('<rect x="31" y="32" width="58" height="26" rx="6"/>', 'k'), ('<circle cx="38" cy="78" r="5"/><circle cx="82" cy="78" r="5"/>', 'a')],
 'swim': [('<path d="M40 22 v46 M68 22 v46 M40 34 h28 M40 50 h28" fill="none" stroke-width="5" stroke-linecap="round"/>', 's'), ('<path d="M14 76 q11 -9 23 0 t23 0 t23 0 t23 0" fill="none" stroke-width="7" stroke-linecap="round"/>', 'p'), ('<path d="M14 94 q11 -9 23 0 t23 0 t23 0 t23 0" fill="none" stroke-width="7" stroke-linecap="round"/>', 'a')],
 'library': [('<rect x="22" y="30" width="18" height="66" rx="3"/>', 'p'), ('<rect x="44" y="40" width="16" height="56" rx="3"/>', 's'), ('<rect x="70" y="28" width="17" height="68" rx="3" transform="rotate(14 78 62)"/>', 'a'), ('<rect x="18" y="94" width="84" height="6" rx="2"/>', 'p')],
 'beach': [('<circle cx="88" cy="30" r="12"/>', 'a'), ('<rect x="10" y="88" width="100" height="40" rx="6"/>', 's'), ('<path d="M58 46 L66 94" fill="none" stroke-width="4" stroke-linecap="round"/>', 's'), ('<path d="M22 56 Q50 18 90 40 Q70 40 58 46 Q44 42 22 56z"/>', 'p')],
 'sports': [('<circle cx="60" cy="60" r="34"/>', 'p'), ('<path d="M60 46 L73 55 L68 70 H52 L47 55z"/>', 'k'), ('<path d="M60 26 v20 M73 55 l20 -6 M68 70 l12 16 M52 70 l-12 16 M47 55 l-20 -6" fill="none" stroke-width="3.500"/>', 'k')],
 'hotel': [('<rect x="20" y="34" width="10" height="62" rx="3"/>', 's'), ('<rect x="30" y="64" width="72" height="18" rx="4"/>', 'p'), ('<rect x="36" y="52" width="22" height="14" rx="6"/>', 'a'), ('<rect x="96" y="70" width="6" height="26" rx="2"/>', 's')],
}
BG = { 'home': ('#5fb6ff', '#1466f0'), 'furniture': ('#57dcd3', '#0f9aa6'), 'grocery': ('#ffbe55', '#ff7a00'), 'chat': ('#7df088', '#12b63c'), 'school': ('#9a97ff', '#4a45d8'), 'work': ('#7a8394', '#2a2f3a'), 'park': ('#86e792', '#1fa046'),
  'fun': ('#ff8ab6', '#ee2c68'), 'gym': ('#ff8a78', '#de2f27'), 'hospital': ('#ff7b84', '#e3262f'), 'bank': ('#5b7fc8', '#1a2c66'), 'food': ('#ffd968', '#ff961c'), 'cinema': ('#cb96ff', '#7630de'), 'salon': ('#ff93e2', '#d23ab4'),
  'bus': ('#86d9ff', '#2795e6'), 'swim': ('#77ebf2', '#0fa3c2'), 'library': ('#dcb087', '#96602f'), 'beach': ('#ffe680', '#ffac00'), 'sports': ('#66d690', '#147a3b'), 'hotel': ('#a3afff', '#525de4') }
OP = {'p': .97, 's': .48, 'a': .74}
def icon(key):
  b0, b1 = BG[key]; u = 'g' + key; parts = []
  for item in SH[key]:
    el, role = (item[0], item[2]) if len(item) == 3 else item
    if role in (None, 'd'): continue
    stroke = 'stroke-width' in el
    if role == 'k': parts.append(f'<g fill="{b1}" stroke="{b1 if stroke else "none"}">{el}</g>'); continue
    parts.append(f'<g fill="url(#{u}w)" stroke="{"#fff" if stroke else "none"}" opacity="{OP[role]}">{el}</g>')
  return (f'<svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="{u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{b0}"/><stop offset="1" stop-color="{b1}"/></linearGradient>'
    f'<linearGradient id="{u}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#eef3ff"/></linearGradient>'
    f'<linearGradient id="{u}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
    f'<filter id="{u}s" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2.500" stdDeviation="2.600" flood-color="{b1}" flood-opacity=".7"/></filter>'
    f'<clipPath id="{u}c"><rect width="120" height="120" rx="26"/></clipPath></defs>'
    f'<g clip-path="url(#{u}c)"><rect width="120" height="120" fill="url(#{u}b)"/><rect width="120" height="64" fill="url(#{u}h)"/><g filter="url(#{u}s)">{"".join(parts)}</g></g>'
    f'<rect x=".7" y=".7" width="118.600" height="118.600" rx="25.400" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width="1.400"/></svg>')
ORDER = ['home', 'furniture', 'grocery', 'chat', 'school', 'work', 'park', 'fun', 'gym', 'hospital', 'bank', 'food', 'cinema', 'salon', 'bus', 'swim', 'library', 'beach', 'sports', 'hotel']
out = {k: icon(k) for k in ORDER}
open(sys.argv[1], 'w').write('// The places menu: app icons drawn for the game in layered white glass on colour.\nexport const GLASS_ICONS = ' + json.dumps(out) + ';\n')
open(sys.argv[2], 'w').write('<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:30px;width:760px;background:#3d4f63;display:grid;grid-template-columns:repeat(5,1fr);gap:26px}div{display:flex;flex-direction:column;align-items:center;gap:6px;color:#fff;font:600 13px -apple-system,sans-serif}svg{width:110px;height:110px;filter:drop-shadow(0 8px 12px rgba(0,0,0,.35))}</style>' + ''.join(f'<div>{out[k]}<span>{k}</span></div>' for k in ORDER))
print('ok')
