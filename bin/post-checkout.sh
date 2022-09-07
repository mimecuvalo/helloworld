#!/bin/bash

# To use this add to .git/hooks/post-checkout
#   bin/post-checkout.sh $1 $2

set -e

CHANGED=$(git diff "$1" "$2" --stat -- ./package.json | wc -l)
if (( CHANGED > 0 )); then
    echo
    echo "🚨 🚨 🚨 package.json has changed! 🚨 🚨 🚨 "
    echo "run 'yarn' in the client directory to get the latest!"
    echo
fi
