#!/bin/bash

set -e

yarn config set script-shell /bin/bash

TMP_DIR=/tmp/extract-tmp
mkdir -p ${TMP_DIR}

SRC_DIR=$(pwd)

yarn flow-remove-types "${SRC_DIR}/.." -d ${TMP_DIR}

NODE_ENV=development yarn formatjs extract "${TMP_DIR}/**/!(*.test).js" \
  --out-file "${SRC_DIR}/../build/messages/en.json" \
  --additional-component-names F \
  --id-interpolation-pattern '[md5:contenthash:hex:10]' \
  --ignore "${TMP_DIR}/util/i18n.js" "${TMP_DIR}/flow-typed" \
  --format smartling

rm -rf ${TMP_DIR}
