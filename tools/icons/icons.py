# Hand-built app icons. Each icon is a list of shapes: (svg element, colour in the illustrated style, role).
# role: p = main body, s = second plane, a = accent, d = shadow/detail. Styles map roles to colours differently.
ICONS = {
 'home': {'bg': ('#7cc8ff', '#2a74e6'), 'shapes': [
   ('<circle cx="90" cy="30" r="10"/>', '#ffe58a', 'a'),
   ('<path d="M0 90 Q60 80 120 90 V120 H0z"/>', '#58c46e', 's'),
   ('<ellipse cx="60" cy="96" rx="36" ry="5"/>', '#2f8a45', 'd'),
   ('<rect x="31" y="58" width="58" height="37" rx="2"/>', '#fff6e8', 'p'),
   ('<rect x="73" y="58" width="16" height="37"/>', '#efd9bb', 's'),
   ('<rect x="76" y="34" width="8" height="16" rx="1"/>', '#a33b2b', 'd'),
   ('<path d="M22 62 L60 30 L98 62 L92 66 L60 39 L28 66z"/>', '#ff5f4e', 'a'),
   ('<rect x="53" y="71" width="14" height="24" rx="2.5"/>', '#7c4f33', 'd'),
   ('<rect x="37" y="66" width="12" height="12" rx="1.5"/>', '#ffd56a', 'a'),
   ('<path d="M43 66v12M37 72h12" stroke="#fff6e8" stroke-width="1.6"/>', None, None)]},
 'grocery': {'bg': ('#ffc15e', '#ff7614'), 'shapes': [
   ('<path d="M38 60 Q38 30 60 30 Q82 30 82 60" fill="none" stroke-width="5.5" stroke-linecap="round"/>', '#ffffff', 'p'),
   ('<circle cx="47" cy="56" r="11"/>', '#ff4545', 'a'),
   ('<circle cx="70" cy="54" r="10"/>', '#77d65d', 's'),
   ('<path d="M54 50 Q62 36 78 42 Q66 44 60 54z"/>', '#ffe066', 'a'),
   ('<path d="M26 60 H94 L86 94 Q85 98 81 98 H39 Q35 98 34 94z"/>', '#ffffff', 'p'),
   ('<rect x="24" y="58" width="72" height="9" rx="4.5"/>', '#f1f1f1', 's'),
   ('<path d="M44 73v16M53 73v16M62 73v16M71 73v16" stroke-width="4" stroke-linecap="round" fill="none"/>', '#ffb56b', 'd')]},
 'chat': {'bg': ('#72e48f', '#13ad48'), 'shapes': [
   ('<path d="M46 28 h36 a14 14 0 0 1 14 14 v12 a14 14 0 0 1 -14 14 h-2 l2 9 l-11 -9 h-25 a14 14 0 0 1 -14 -14 v-12 a14 14 0 0 1 14 -14z"/>', '#ffffff', 's'),
   ('<path d="M36 46 h36 a14 14 0 0 1 14 14 v14 a14 14 0 0 1 -14 14 h-24 l-13 10 l2 -10 h-1 a14 14 0 0 1 -14 -14 v-14 a14 14 0 0 1 14 -14z"/>', '#ffffff', 'p'),
   ('<circle cx="42" cy="67" r="4"/><circle cx="54" cy="67" r="4"/><circle cx="66" cy="67" r="4"/>', '#13ad48', 'd')]},
 'gym': {'bg': ('#4a505e', '#16181d'), 'shapes': [
   ('<rect x="24" y="56" width="72" height="8" rx="4"/>', '#d9dfe6', 's'),
   ('<rect x="26" y="40" width="11" height="40" rx="3.5"/><rect x="83" y="40" width="11" height="40" rx="3.5"/>', '#ff5a4c', 'a'),
   ('<rect x="37" y="46" width="8" height="28" rx="3"/><rect x="75" y="46" width="8" height="28" rx="3"/>', '#ff8a6e', 'p'),
   ('<rect x="17" y="54" width="9" height="12" rx="3"/><rect x="94" y="54" width="9" height="12" rx="3"/>', '#9aa3ad', 'd')]},
}
def svg(key, style, size=120):
  ic = ICONS[key]; u = f'{key}{style}'; b0, b1 = ic['bg']; body = []
  for el, colA, role in ic['shapes']:
    if role is None:
      col = '#fff6e8' if style == 'A' else 'rgba(255,255,255,0)'
      body.append(el if style == 'A' else ''); continue
    if style == 'A': fill, op = colA, 1
    elif style == 'B': fill, op = '#ffffff', {'p': .96, 's': .5, 'a': .78, 'd': 0.0}[role]
    else: fill, op = {'p': '#ffffff', 's': '#ffffff', 'a': '#141414', 'd': b1}[role], {'p': 1, 's': .55, 'a': 1, 'd': 1}[role]
    if op == 0: continue
    stroke = 'stroke' in el and 'stroke="' not in el
    attr = f'stroke="{fill}" fill="none"' if stroke else f'fill="{fill}"'
    if 'stroke="' in el and 'fill="none"' in el: attr = ''
    el2 = el.replace('/>', f' {attr} opacity="{op}"/>') if '<path' in el or '<rect' in el or '<circle' in el or '<ellipse' in el else el
    if stroke: el2 = el2.replace('stroke-width', f'stroke="{fill}" stroke-width',1).replace(f' stroke="{fill}" fill="none" opacity', ' opacity')
    body.append(f'<g opacity="{op}" fill="{fill}" stroke="{fill if stroke else "none"}">{el}</g>')
  sheen = '' if style == 'C' else f'<rect width="120" height="60" fill="url(#{u}h)"/>'
  shadow = f'filter="url(#{u}s)"' if style != 'C' else ''
  return f'''<svg width="{size}" height="{size}" viewBox="0 0 120 120"><defs>
<linearGradient id="{u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{b0}"/><stop offset="1" stop-color="{b1}"/></linearGradient>
<linearGradient id="{u}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<filter id="{u}s" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2.500" stdDeviation="2.500" flood-color="#000" flood-opacity=".22"/></filter>
<clipPath id="{u}c"><rect width="120" height="120" rx="26"/></clipPath></defs>
<g clip-path="url(#{u}c)"><rect width="120" height="120" fill="{'url(#'+u+'b)' if style!='C' else b1}"/>{sheen}<g {shadow}>{''.join(body)}</g></g>
<rect x=".7" y=".7" width="118.600" height="118.600" rx="25.400" fill="none" stroke="#fff" stroke-opacity="{.3 if style!='C' else 0}" stroke-width="1.400"/></svg>'''
names = {'A': 'A · Illustrated (custom drawn objects, real colours)', 'B': 'B · Liquid glass (layered white glass on colour)', 'C': 'C · Bold flat (like your reference sheet)'}
rows = ''.join(f'<h2>{names[s]}</h2><div class="row">' + ''.join(f'<div class="cell">{svg(k, s)}<span>{k.title() if k!="grocery" else "Supermarket"}</span></div>' for k in ICONS) + '</div>' for s in 'ABC')
html = f'''<!doctype html><meta charset="utf-8"><title>Icon options</title><style>body{{margin:0;padding:28px 36px;background:linear-gradient(180deg,#5d7894,#2b3a4c);font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#fff}}h2{{font-size:20px;font-weight:600;margin:18px 0 12px}}.row{{display:flex;gap:34px}}.cell{{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:14px;font-weight:600}}svg{{filter:drop-shadow(0 10px 14px rgba(0,0,0,.35))}}</style>{rows}'''
open('/private/tmp/claude-501/-Users-ezechukwukingsleyorji--claude-spares-spare-e4FxxB/97915664-cc7c-417a-98ea-9d6d3bc7688e/scratchpad/street/icon-options.html','w').write(html)
print('ok')
