# App icons in the style of the reference board: soft 3D white objects, rich gradients, glowing blobs,
# little mascots, layered translucent shapes. Each icon is one SVG (120 x 120), ids prefixed so many can share a page.
import json, sys
def lin(i, c0, c1, x1=0, y1=0, x2=0, y2=1, mid=None):
  st = f'<stop offset="0" stop-color="{c0}"/>' + (f'<stop offset=".5" stop-color="{mid}"/>' if mid else '') + f'<stop offset="1" stop-color="{c1}"/>'
  return f'<linearGradient id="{i}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{st}</linearGradient>'
def rad(i, c0, c1, cx=.35, cy=.3, r=.8):
  return f'<radialGradient id="{i}" cx="{cx}" cy="{cy}" r="{r}"><stop offset="0" stop-color="{c0}"/><stop offset="1" stop-color="{c1}"/></radialGradient>'
def soft(u, els, shadow, dy=4, op=.45):   # a soft white object: a blurred shadow in the tile's own deep colour, then the body lit from above
  return (f'<g transform="translate(0 {dy})" opacity="{op}" filter="url(#{u}bl)">{els.replace("{P}", shadow)}</g>' + els.replace('{P}', f'url(#{u}w)'))
def glow(u, els, paint, color, dy=6, op=.5):  # a coloured object that lights the tile under it
  return (f'<g transform="translate(0 {dy})" opacity="{op}" filter="url(#{u}gl)">{els.replace("{P}", color)}</g>' + els.replace('{P}', paint))
WHITE_TILE = ('#ffffff', '#e9edf4')
def make(u, tile, body, defs=''):
  t0, t1 = tile
  return (f'<svg viewBox="0 0 120 120" aria-hidden="true"><defs>{lin(u+"t", t0, t1, 0, 0, .35, 1)}'
    f'<linearGradient id="{u}w" gradientUnits="userSpaceOnUse" x1="0" y1="22" x2="0" y2="100"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e2e8f2"/></linearGradient>'
    f'<filter id="{u}bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.200"/></filter>'
    f'<filter id="{u}gl" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6"/></filter>'
    f'<clipPath id="{u}c"><rect width="120" height="120" rx="26"/></clipPath>{defs}</defs>'
    f'<g clip-path="url(#{u}c)"><rect width="120" height="120" fill="url(#{u}t)"/>{body}</g>'
    f'<rect x=".6" y=".6" width="118.800" height="118.800" rx="25.400" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.200"/></svg>')
I = {}
# Home: a white tile, the house itself a rich mint-to-violet-to-pink gradient with soft swirling bands
house = 'M60 32 Q63.500 32 67 35 L87 53 Q91 57 91 62 V82 Q91 91 82 91 H71 V75 Q71 68 64 68 H56 Q49 68 49 75 V91 H38 Q29 91 29 82 V62 Q29 57 33 53 L53 35 Q56.500 32 60 32z'
I['home'] = make('home', WHITE_TILE,
  f'<path d="{house}" transform="translate(0 7)" fill="#6a5f9a" opacity=".28" filter="url(#homegl)"/>'
  f'<clipPath id="homeh"><path d="{house}"/></clipPath><path d="{house}" fill="url(#homeg)"/>'
  '<g clip-path="url(#homeh)"><circle cx="100" cy="104" r="48" fill="#5b3fb8" opacity=".35"/><circle cx="104" cy="108" r="34" fill="#e0458f" opacity=".55"/><circle cx="20" cy="20" r="40" fill="#fff" opacity=".12"/></g>',
  lin('homeg', '#8ff5cf', '#d64a9a', 0, 0, .9, 1, '#4f9ab8'))
# Furniture shop: a plump white sofa standing out of a teal tile
sofa = '<rect x="31" y="37" width="58" height="28" rx="11" fill="{P}"/><rect x="19" y="52" width="19" height="34" rx="9.500" fill="{P}"/><rect x="82" y="52" width="19" height="34" rx="9.500" fill="{P}"/><rect x="31" y="62" width="58" height="22" rx="8" fill="{P}"/><rect x="26" y="84" width="7" height="8" rx="3" fill="{P}"/><rect x="87" y="84" width="7" height="8" rx="3" fill="{P}"/>'
I['furniture'] = make('furniture', ('#5ee0d4', '#0b8597'), soft('furniture', sofa, '#05505c') + '<path d="M36 64 Q60 70 84 64" fill="none" stroke="#c9d6e6" stroke-width="1.600" stroke-linecap="round"/>')
# Supermarket: a white bag tile with a grey handle and groceries tumbling out, see-through where they overlap
I['grocery'] = make('grocery', WHITE_TILE,
  '<path d="M40 36 Q40 17 60 17 Q80 17 80 36" fill="none" stroke="#a3abb6" stroke-width="3.600" stroke-linecap="round"/><circle cx="40" cy="36" r="2.800" fill="#8a929c"/><circle cx="80" cy="36" r="2.800" fill="#8a929c"/>'
  '<g transform="rotate(-10 32 84)"><rect x="6" y="58" width="50" height="44" rx="10" fill="url(#groceryb)"/><rect x="6" y="58" width="50" height="14" rx="7" fill="#fff" opacity=".22"/></g>'
  '<g transform="rotate(28 66 80)" opacity=".92"><rect x="56" y="48" width="22" height="64" rx="10" fill="url(#grocerybt)"/><rect x="60" y="40" width="14" height="12" rx="4" fill="#4fd8ff"/><ellipse cx="64" cy="70" rx="2.600" ry="5" fill="#fff" opacity=".85"/></g>'
  '<path d="M96 64 Q108 58 114 68 Q122 82 110 98 Q102 108 92 102 Q80 106 76 92 Q72 76 84 68 Q90 64 96 64z" fill="url(#grocerya)" opacity=".86"/>',
  lin('groceryb', '#ffd23d', '#ff7a00', 0, 0, 1, 1) + lin('grocerybt', '#7ae7ff', '#16a2e6') + lin('grocerya', '#ff8ab0', '#ff2d55', 0, 0, 1, 1))
# Chat: a soft glowing blue bubble resting on a pale tile
bub = '<path d="M64 30 C82 30 94 43 94 58 C94 74 81 86 64 86 C58 86 53 85 49 83 L32 92 Q30 93 30.500 91 L35 77 C30 72 33 64 33 58 C33 43 46 30 64 30z" fill="{P}"/>'
I['chat'] = make('chat', ('#f4f6fa', '#dbe2ec'), glow('chat', bub, 'url(#chatg)', '#1f5cff', 7, .55) + '<ellipse cx="52" cy="44" rx="11" ry="6" fill="#fff" opacity=".22" transform="rotate(-25 52 44)"/>',
  rad('chatg', '#48c4ff', '#0838d6', .3, .25, .9))
# School: a thick white book opened on a violet tile, with a red ribbon marker
book = '<path d="M58 40 C47 33 33 33 23 37 V82 C33 78 47 78 58 85z" fill="{P}"/><path d="M62 40 C73 33 87 33 97 37 V82 C87 78 73 78 62 85z" fill="{P}"/>'
I['school'] = make('school', ('#a597ff', '#5233df'),
  '<path d="M20 42 V86 Q40 81 60 90 Q80 81 100 86 V42z" fill="#d8dcef" transform="translate(0 2)"/>' + soft('school', book, '#2a1590') + '<path d="M84 34 V54 L88 50 L92 54 V35z" fill="#ff5a6e"/>')
# Work: a white briefcase floating on a bright electric-blue tile with a light bloom behind it
case = '<path d="M48 43 V38 Q48 31 55 31 H65 Q72 31 72 38 V43" fill="none" stroke="{P}" stroke-width="6"/><rect x="25" y="42" width="70" height="47" rx="13" fill="{P}"/>'
I['work'] = make('work', ('#2ed0ff', '#2c3cf2'), '<circle cx="60" cy="44" r="38" fill="#fff" opacity=".18" filter="url(#workgl)"/>' + soft('work', case, '#12209c') + '<rect x="25" y="61" width="70" height="3" fill="#cdd8f2"/><rect x="53" y="56" width="14" height="13" rx="3" fill="#bfcde9"/>')
# Park: a round glowing tree on a pale tile
tree = '<circle cx="60" cy="48" r="24" fill="{P}"/><circle cx="43" cy="58" r="17" fill="{P}"/><circle cx="77" cy="58" r="17" fill="{P}"/><rect x="40" y="56" width="40" height="18" rx="9" fill="{P}"/>'
I['park'] = make('park', ('#f3f6f4', '#dbe5df'), '<rect x="56" y="66" width="8" height="26" rx="4" fill="#b37d4e"/>' + glow('park', tree, 'url(#parkg)', '#2fae4e', 7, .45) + '<ellipse cx="52" cy="38" rx="9" ry="5" fill="#fff" opacity=".3" transform="rotate(-25 52 38)"/>',
  rad('parkg', '#9ff07a', '#13923d', .35, .25, .9))
# Activities: a cheeky white bunny mascot with a sparkle, on a sunny orange tile
bun = '<path d="M33 92 Q28 60 50 50 Q42 30 48 22 Q56 16 60 30 Q62 38 61 46 Q66 34 74 32 Q84 30 80 44 Q78 50 74 54 Q92 62 88 92 Q60 98 33 92z" fill="{P}"/>'
I['fun'] = make('fun', ('#ffc400', '#ff5e00'), soft('fun', bun, '#b23c00') + '<ellipse cx="54" cy="72" rx="3.400" ry="5.600" fill="#1c1c1c"/><ellipse cx="66" cy="72" rx="3.400" ry="5.600" fill="#1c1c1c"/>'
  '<path d="M96 30 Q97.500 38 104 39.500 Q97.500 41 96 49 Q94.500 41 88 39.500 Q94.500 38 96 30z" fill="#fff"/>')
# Gym: a dumbbell of soft white rounded bars on a red-to-pink tile
bars = '<path d="M38 60 H82" stroke="{P}" stroke-width="8" stroke-linecap="round" fill="none"/><path d="M29 47 V73 M42 40 V80 M78 40 V80 M91 47 V73" stroke="{P}" stroke-width="11" stroke-linecap="round" fill="none"/>'
I['gym'] = make('gym', ('#ff7a5c', '#e5135a'), soft('gym', bars, '#8a0a2e', 5, .5))
# Hospital: a soft red cross glowing on a pale tile
cross = '<rect x="49" y="28" width="22" height="64" rx="10" fill="{P}"/><rect x="28" y="49" width="64" height="22" rx="10" fill="{P}"/>'
I['hospital'] = make('hospital', ('#f6f7fa', '#dfe4ec'), glow('hospital', cross, 'url(#hospitalg)', '#ff1f3d', 7, .45) + '<rect x="52" y="31" width="7" height="26" rx="3.500" fill="#fff" opacity=".28"/>', rad('hospitalg', '#ff8a8f', '#d80f2a', .35, .2, .9))
# Bank: a stack of glowing gold coins on a deep navy tile
coins = ''.join(f'<rect x="33" y="{y}" width="54" height="11" rx="5.500" fill="#c97a0c"/><ellipse cx="60" cy="{y}" rx="27" ry="8.500" fill="url(#bankg)"/>' for y in (82, 70, 58))
I['bank'] = make('bank', ('#3b46a8', '#121848'), '<ellipse cx="60" cy="74" rx="40" ry="26" fill="#ffc83a" opacity=".22" filter="url(#bankgl)"/>' + coins +
  '<ellipse cx="60" cy="46" rx="27" ry="8.500" fill="url(#bankg)"/><rect x="33" y="46" width="54" height="11" rx="5.500" fill="#c97a0c"/><ellipse cx="60" cy="46" rx="27" ry="8.500" fill="url(#bankg)"/><ellipse cx="60" cy="46" rx="17" ry="5" fill="none" stroke="#fff3c4" stroke-width="2" opacity=".8"/>',
  lin('bankg', '#fff0a0', '#f2a516', 0, 0, 1, 1))
# Restaurant: a warm waffle tile with white cream dripping over it and a few drops
cream = '<path d="M0 0 H120 V56 Q113 70 101 66 Q92 63 92 52 Q90 43 83 46 Q77 50 77 40 Q75 30 67 33 Q60 37 59 29 Q55 21 47 29 Q41 37 40 48 Q38 61 27 61 Q17 61 15 50 Q12 41 0 46z" fill="{P}"/>'
grid = ''.join(f'<rect x="{x}" y="0" width="2" height="120" fill="#c95f00" opacity=".14"/>' for x in (30, 60, 90)) + ''.join(f'<rect x="0" y="{y}" width="120" height="2" fill="#c95f00" opacity=".14"/>' for y in (30, 60, 90))
I['food'] = make('food', ('#ffbd55', '#ff8618'), grid + soft('food', cream, '#c25300', 5, .5) + '<circle cx="47" cy="76" r="7.500" fill="url(#foodw)"/><circle cx="31" cy="90" r="4.500" fill="url(#foodw)"/><circle cx="86" cy="30" r="6" fill="#ffad42"/>',
  '<linearGradient id="foodw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e4e9f2"/></linearGradient>')
# Cinema: a soft white play button on violet, with bands of colour rising from the corner
play = '<path d="M47 36 Q47 29 53.500 32.500 L85 51 Q91 55 85 59 L53.500 77.500 Q47 81 47 74z" fill="{P}"/>'
I['cinema'] = make('cinema', ('#7c63ff', '#3412d6'), '<circle cx="4" cy="122" r="40" fill="#ffd23d" opacity=".95"/><circle cx="38" cy="132" r="34" fill="#ff4f9a" opacity=".85"/><circle cx="74" cy="138" r="30" fill="#36e0d8" opacity=".8"/>' + soft('cinema', play, '#1d0a8a', 5, .5))
# Salon: a white sweeping curl with a translucent petal, on an orange-to-pink tile
I['salon'] = make('salon', ('#ff8a3c', '#ff1f7c'), soft('salon', '<path d="M76 26 Q80 26 80 30 V70 Q80 94 58 94 Q36 94 36 74 Q36 66 44 66 Q56 66 58 76 Q60 84 64 78 Q68 72 68 62 V36 Q68 26 76 26z" fill="{P}"/>', '#a8004a', 5, .45) +
  '<path d="M30 50 Q46 40 56 56 Q48 72 32 68 Q24 60 30 50z" fill="#fff" opacity=".6"/>')
# Bus station: a white bus front on blue, with colour rising behind it
bus = '<rect x="32" y="27" width="56" height="54" rx="15" fill="{P}"/><rect x="36" y="79" width="12" height="11" rx="5" fill="{P}"/><rect x="72" y="79" width="12" height="11" rx="5" fill="{P}"/>'
I['bus'] = make('bus', ('#38b4ff', '#1d46e2'), '<circle cx="118" cy="120" r="40" fill="#36e0d8" opacity=".85"/><circle cx="82" cy="132" r="32" fill="#ffd23d" opacity=".9"/>' + soft('bus', bus, '#0d2a9a', 5, .5) +
  '<rect x="39" y="35" width="42" height="20" rx="7" fill="#7fc8ff"/><rect x="39" y="35" width="42" height="7" rx="3.500" fill="#fff" opacity=".35"/><circle cx="44" cy="69" r="4" fill="#ffd23d"/><circle cx="76" cy="69" r="4" fill="#ffd23d"/>')
# Swimming pool: a friendly water drop with a face, on aqua
drop = '<path d="M60 22 Q86 52 86 71 Q86 96 60 96 Q34 96 34 71 Q34 52 60 22z" fill="{P}"/>'
I['swim'] = make('swim', ('#55e6f2', '#1a74e6'), '<path d="M0 98 Q20 90 40 98 T80 98 T120 98 V120 H0z" fill="#fff" opacity=".22"/>' + soft('swim', drop, '#0a4aa8', 5, .5) +
  '<ellipse cx="52" cy="72" rx="3.400" ry="5.200" fill="#1a4fb8"/><ellipse cx="68" cy="72" rx="3.400" ry="5.200" fill="#1a4fb8"/><path d="M54 82 Q60 87 66 82" fill="none" stroke="#1a4fb8" stroke-width="2.600" stroke-linecap="round"/><ellipse cx="45" cy="80" rx="4" ry="2.400" fill="#ff8ab4" opacity=".55"/><ellipse cx="75" cy="80" rx="4" ry="2.400" fill="#ff8ab4" opacity=".55"/>')
# Library: thick white pages fanned open on a warm orange tile
pages = '<path d="M58 38 C46 30 31 31 20 36 V84 C31 79 46 79 58 87z" fill="{P}"/><path d="M62 38 C74 30 89 31 100 36 V84 C89 79 74 79 62 87z" fill="{P}"/>'
I['library'] = make('library', ('#ffa83c', '#ff7400'), '<path d="M17 40 V88 Q38 82 60 92 Q82 82 103 88 V40z" fill="#eef1f6" transform="translate(0 3)" opacity=".95"/>' + soft('library', pages, '#b84b00', 5, .45))
# Beach: a smiling white cloud with the sun peeking out, on a violet-to-sky tile
cloud = '<circle cx="42" cy="80" r="19" fill="{P}"/><circle cx="64" cy="66" r="25" fill="{P}"/><circle cx="88" cy="80" r="19" fill="{P}"/><rect x="24" y="78" width="82" height="30" rx="14" fill="{P}"/>'
I['beach'] = make('beach', ('#9b7cff', '#58b0ff'), '<circle cx="90" cy="34" r="15" fill="#ffd23d"/><circle cx="90" cy="34" r="22" fill="#ffd23d" opacity=".3" filter="url(#beachgl)"/><circle cx="80" cy="56" r="20" fill="#fff" opacity=".35"/>' + soft('beach', cloud, '#4d36c8', 5, .4) +
  '<ellipse cx="52" cy="84" rx="3.600" ry="5.600" fill="#5a46d6"/><ellipse cx="76" cy="84" rx="3.600" ry="5.600" fill="#5a46d6"/><path d="M58 94 Q64 99 70 94" fill="none" stroke="#5a46d6" stroke-width="3" stroke-linecap="round"/><ellipse cx="44" cy="93" rx="5" ry="3" fill="#ff9ad0" opacity=".5"/><ellipse cx="84" cy="93" rx="5" ry="3" fill="#ff9ad0" opacity=".5"/>')
# Sports ground: a white ball sticker on an orange-to-pink tile, its corner peeling up
ball = '<circle cx="56" cy="56" r="27" fill="{P}"/>'
I['sports'] = make('sports', ('#ff9a2a', '#ff2a78'), soft('sports', ball, '#a80a3c', 5, .5) +
  '<path d="M56 45 L66.500 52.500 L62.500 64.500 H49.500 L45.500 52.500z" fill="#c9d1de"/><path d="M56 29 V45 M66.500 52.500 L81 48 M62.500 64.500 L71 77 M49.500 64.500 L41 77 M45.500 52.500 L31 48" stroke="#c9d1de" stroke-width="2.600" fill="none" stroke-linecap="round"/>'
  '<path d="M120 76 Q104 82 98 98 Q92 112 80 120 H120z" fill="#000" opacity=".18" filter="url(#sportsbl)"/><path d="M120 78 Q102 86 98 100 Q94 112 82 120 Q104 120 112 108 Q120 96 120 78z" fill="url(#sportsp)"/>',
  lin('sportsp', '#ffd2e3', '#ffffff', 0, 0, 1, 1))
# Hotel: a sleepy golden cat peeking in from the corner, on lilac
cat = '<path d="M20 124 Q18 76 46 58 L50 38 Q52 32 57 37 L68 52 Q86 50 100 60 L110 44 Q114 40 116 46 L118 70 Q124 92 122 124z" fill="url(#hotelfur)"/>'
I['hotel'] = make('hotel', ('#c98cff', '#9a66f2'), f'<g transform="translate(0 4)" opacity=".35" filter="url(#hotelbl)">{cat.replace("url(#hotelfur)", "#6a2ab8")}</g>' + cat +
  '<path d="M54 84 Q60 90 66 84" fill="none" stroke="#6a3c12" stroke-width="3" stroke-linecap="round"/><path d="M84 84 Q90 90 96 84" fill="none" stroke="#6a3c12" stroke-width="3" stroke-linecap="round"/><path d="M73 92 q2 -2.500 4 0 q2 -2.500 4 0 q-1 3 -4 4.500 q-3 -1.500 -4 -4.500z" fill="#ff6f8a"/>'
  '<ellipse cx="52" cy="96" rx="5" ry="3" fill="#ff9a9a" opacity=".5"/><ellipse cx="100" cy="96" rx="5" ry="3" fill="#ff9a9a" opacity=".5"/><text x="36" y="40" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="900" font-size="15" fill="#fff">z</text><text x="24" y="28" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="900" font-size="10" fill="#fff" opacity=".8">z</text>',
  rad('hotelfur', '#fff07a', '#ffb000', .45, .35, .8))
ORDER = ['home', 'furniture', 'grocery', 'chat', 'school', 'work', 'park', 'fun', 'gym', 'hospital', 'bank', 'food', 'cinema', 'salon', 'bus', 'swim', 'library', 'beach', 'sports', 'hotel']
open(sys.argv[1], 'w').write('// The places menu: app icons drawn for the game, after the reference board (soft 3D white objects, gradients, glowing blobs, mascots).\nexport const ART_ICONS = ' + json.dumps({k: I[k] for k in ORDER}) + ';\n')
if len(sys.argv) > 2:
  open(sys.argv[2], 'w').write('<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:34px;width:760px;background:#eef0f4;display:grid;grid-template-columns:repeat(5,1fr);gap:26px}div{display:flex;flex-direction:column;align-items:center;gap:7px;font:600 13px -apple-system,sans-serif;color:#222}svg{width:118px;height:118px;filter:drop-shadow(0 10px 14px rgba(20,30,50,.22))}</style>' + ''.join(f'<div>{I[k]}<span>{k}</span></div>' for k in ORDER))
print('ok')
