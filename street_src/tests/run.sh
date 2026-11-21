#!/bin/sh
# Unit tests without Node: bundles every *.test.js here into one file with esbuild and runs it on
# macOS's built-in JavaScriptCore (jsc), or on node when jsc is missing. Exits non-zero on any failure.
set -e
cd "$(dirname "$0")/../.."
ESBUILD="${ESBUILD:-$HOME/development/tools/esbuild/bin/esbuild}"
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
mkdir -p build/tests
ENTRY=build/tests/entry.js
: > "$ENTRY"
for f in street_src/tests/*.test.js; do echo "import '../../$f';" >> "$ENTRY"; done
echo "import { finish } from '../../street_src/tests/harness.js'; finish();" >> "$ENTRY"
"$ESBUILD" "$ENTRY" --bundle --format=iife --target=es2020 --outfile=build/tests/all.js --log-level=warning
if [ -x "$JSC" ]; then "$JSC" build/tests/all.js
elif command -v node >/dev/null 2>&1; then node build/tests/all.js
else echo "FAIL: no JavaScript runner (jsc or node) found"; exit 1; fi
