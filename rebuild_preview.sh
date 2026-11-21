#!/bin/sh
# Rebuild the browser game and refresh the copy the preview serves (the preview app cannot read the Desktop).
set -e
cd "$(dirname "$0")"
ESBUILD=street_src/node_modules/.bin/esbuild sh build_street.sh
[ -n "$1" ] && cp assets/street/index.html "$1/index.html"
