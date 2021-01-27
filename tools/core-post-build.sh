#!/bin/bash

DEPLOYMENT=$1

if [ -d "../built_$DEPLOYMENT/core/css" ]; then
    echo "Copying css file for core..."
    cp -f ../built_$DEPLOYMENT/core/css/styles__*.css ../built_$DEPLOYMENT/core/pdf/styles.css
fi
