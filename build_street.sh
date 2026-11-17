#!/bin/sh
# Bundles the Three.js street (street_src/) into one self-contained HTML file
# at assets/street/index.html, which the Flutter app loads in a web view.
set -e
cd "$(dirname "$0")"
ESBUILD="${ESBUILD:-$HOME/development/tools/esbuild/bin/esbuild}"
mkdir -p build assets/street
"$ESBUILD" street_src/main.js --bundle --minify --format=iife --target=es2020,safari15 \
  --loader:.glb=binary --loader:.jpg=binary --outfile=build/street.js --log-level=warning
/usr/bin/python3 - <<'PY'
js = open('build/street.js', encoding='utf-8').read().replace('</script', '<\\/script')
html = open('street_src/index.html', encoding='utf-8').read()
open('assets/street/index.html', 'w', encoding='utf-8').write(html.replace('/*BUNDLE*/', js))
print('assets/street/index.html', round(len(js) / 1024), 'KB of script')
PY
