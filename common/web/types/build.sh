#!/usr/bin/env bash
#
# Compiles the common file types module
#

# Exit on command failure and when using unset variables:
set -eu

## START STANDARD BUILD SCRIPT INCLUDE
# adjust relative paths as necessary
THIS_SCRIPT="$(greadlink -f "${BASH_SOURCE[0]}" 2>/dev/null || readlink -f "${BASH_SOURCE[0]}")"
. "$(dirname "$THIS_SCRIPT")/../../../resources/build/build-utils.sh"
## END STANDARD BUILD SCRIPT INCLUDE

cd "$THIS_SCRIPT_PATH"

. "$KEYMAN_ROOT/resources/shellHelperFunctions.sh"

builder_describe "Build Keyman common file types module" \
  "configure" \
  "build" \
  "clean" \
  "test" \
  "publish                   publish to npm" \
  "--dry-run,-n              don't actually publish, just dry run"

builder_parse "$@"

#-------------------------------------------------------------------------------------------------------------------

if builder_start_action clean; then
  rm -rf ./build/ ./tsconfig.tsbuildinfo
  builder_finish_action success clean
else
  # We need the schema file at runtime and bundled, so always copy it for all actions except `clean`
  mkdir -p "$THIS_SCRIPT_PATH/build/src/"
  cp "$KEYMAN_ROOT/resources/standards-data/ldml-keyboards/techpreview/ldml-keyboard.schema.json" "$THIS_SCRIPT_PATH/build/src/"
  cp "$KEYMAN_ROOT/common/schemas/kvks/kvks.schema.json" "$THIS_SCRIPT_PATH/build/src/"
  cp "$KEYMAN_ROOT/common/schemas/keyman-touch-layout/keyman-touch-layout.clean.spec.json" "$THIS_SCRIPT_PATH/build/src/"
fi

#-------------------------------------------------------------------------------------------------------------------

if builder_start_action configure; then
  verify_npm_setup
  builder_finish_action success configure
fi

#-------------------------------------------------------------------------------------------------------------------

if builder_start_action build; then
  npm run build
  builder_finish_action success build
fi

#-------------------------------------------------------------------------------------------------------------------

if builder_start_action test; then
  npm test
  builder_finish_action success test
fi

#-------------------------------------------------------------------------------------------------------------------

if builder_start_action publish; then
  . "$KEYMAN_ROOT/resources/build/npm-publish.inc.sh"
  npm_publish
  builder_finish_action success publish
fi
