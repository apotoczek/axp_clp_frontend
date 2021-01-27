#!/bin/bash

set -e

if [ "$1" == "commander" ]; then
    npm run build:commander
elif [ "$1" == "core" ]; then
    npm run build:core
elif [ "$1" == "storybook" ]; then
    npm run build:storybook
else
    npm run build:core
    npm run build:commander
    npm run build:storybook
fi
