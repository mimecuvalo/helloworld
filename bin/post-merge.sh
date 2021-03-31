#!/bin/bash

set -e

CHANGED=$(git diff HEAD@{1} --stat -- ./package.json | wc -l)
if (( CHANGED > 0 )); then
    echo
    echo "🚨 🚨 🚨 package.json has changed! 🚨 🚨 🚨 "
    echo "run 'npm install' in the client directory to get the latest!"
    echo
fi
