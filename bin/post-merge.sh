#!/bin/bash

# To use this add to .git/hooks/post-merge
#   bin/post-merge.sh

set -e

CHANGED=$(git diff HEAD@{1} --stat -- ./package.json | wc -l)
if (( CHANGED > 0 )); then
    echo
    echo "🚨 🚨 🚨 package.json has changed! 🚨 🚨 🚨 "
    echo "run 'yarn' in the client directory to get the latest!"
    echo
fi
