#!/bin/bash

set -e

yarn config set script-shell /bin/bash

SRC_DIR=$(pwd)

NODE_ENV=development yarn formatjs compile "${SRC_DIR}/../build/messages/en.json" \
   --out-file "${SRC_DIR}/../build/messages/en-compiled.json" \
   --format smartling
