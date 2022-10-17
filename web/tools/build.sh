#!/usr/bin/env bash
#
# Compile KeymanWeb's dev & test tool modules
#
set -eu

## START STANDARD BUILD SCRIPT INCLUDE
# adjust relative paths as necessary
THIS_SCRIPT="$(greadlink -f "${BASH_SOURCE[0]}" 2>/dev/null || readlink -f "${BASH_SOURCE[0]}")"
. "$(dirname "$THIS_SCRIPT")/../../resources/build/build-utils.sh"
## END STANDARD BUILD SCRIPT INCLUDE

. "$KEYMAN_ROOT/resources/shellHelperFunctions.sh"

# This script runs from its own folder
cd "$(dirname "$THIS_SCRIPT")"

################################ Main script ################################

# Note:  common/web/recorder is only needed for :recorder, but the builder can't do target-only dependencies yet.

builder_describe "Builds the Keyman Engine for Web's development & unit-testing tools" \
  "@../../common/web/keyman-version" \
  "@../../common/web/keyboard-processor" \
  "@../../common/web/recorder" \
  "clean" \
  "configure" \
  "build" \
  ":device     Builds the device-detect submodule" \
  ":recorder   Builds the KMW recorder submodule for development of unit-test resources" \
  ":wrappers   Builds the submodule for isolated testing of the outputTarget wrappers for various elements"

builder_describe_outputs \
  configure:device   /node_modules \
  configure:recorder /node_modules \
  configure:wrapper  /node_modules \
  build:device       device-detect/build/index.js \
  build:recorder     recorder/build/index.js \
  build:wrappers     element-wrappers/build/index.js

builder_parse "$@"

### CONFIGURE ACTIONS

if builder_start_action configure; then
  verify_npm_setup
  builder_finish_action success configure
fi

### CLEAN ACTIONS

if builder_start_action clean:device; then
  rm -rf device-detect/build/
  builder_finish_action success clean:device
fi

if builder_start_action clean:recorder; then
  rm -rf recorder/build/
  builder_finish_action success clean:recorder
fi

if builder_start_action clean:wrappers; then
  rm -rf element-wrappers/build/
  builder_finish_action success clean:wrappers
fi

### BUILD ACTIONS

if builder_start_action build:device; then
  npm run tsc -- -b tools/device-detect/tsconfig.json

  builder_finish_action success build:device
fi

if builder_start_action build:recorder; then
  npm run tsc -- -b tools/recorder/tsconfig.json

  builder_finish_action success build:recorder
fi

if builder_start_action build:wrappers; then
  npm run tsc -- -b tools/element-wrappers/tsconfig.json

  builder_finish_action success build:wrappers
fi