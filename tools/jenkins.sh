#!/bin/bash

set -e

# Make sure deployment is set
if [ -z "$DEPLOYMENT" ]; then
    echo "No deployment set, exiting..."
    exit 1
fi

if [ "$NODE_ENV" != "production"] || [ "$NODE_ENV" != "staging" ]; then
    echo "NODE_ENV is not set to production or staging, exiting..."
    exit 1
fi

if [ -z "$GIT_BRANCH" ]; then
    echo "Couldn't find git branch, maybe git plugin is missing?"
    exit 1
fi

GITREV=$(git rev-parse --short HEAD)
BRANCH=${GIT_BRANCH/origin\//}
BUILD_NAME="$DEPLOYMENT-$BRANCH-build-$GITREV.tgz"

REPO_PATH="$WORKSPACE/repo"

BUILT_PATH="$REPO_PATH/built"
REV_FILE="$BUILT_PATH/rev"

COMMANDER_SRC_PATH="$REPO_PATH/commander"
TESTS_PATH="$REPO_PATH/tests"
CORE_SRC_PATH="$REPO_PATH/core"
LIBS_PATH="$REPO_PATH/shared"

BACKUPCONFIG="$REPO_PATH/tools/s3backup-config.yaml"

# Install required node modules
npm ci

# Run tests
CHROME_BIN='chromium-browser' node_modules/.bin/karma start ../tests/jenkins.conf.js

# Build
./build.sh core
./build.sh commander

echo $GITREV > $REV_FILE

s3backup --config $BACKUPCONFIG backup --target $BUILT_PATH --rename $BUILD_NAME
