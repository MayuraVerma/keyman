#!/usr/bin/env bash
#
# Compiles the Language Modeling Layer for common use in predictive text and autocorrective applications.
# Designed for optimal compatibility with the Keyman Suite.
#

# Exit on command failure and when using unset variables:
set -eu

# Include some helper functions from resources

## START STANDARD BUILD SCRIPT INCLUDE
# adjust relative paths as necessary
THIS_SCRIPT="$(greadlink -f "${BASH_SOURCE[0]}" 2>/dev/null || readlink -f "${BASH_SOURCE[0]}")"
. "$(dirname "$THIS_SCRIPT")/../../../resources/build/build-utils.sh"
## END STANDARD BUILD SCRIPT INCLUDE

. "$KEYMAN_ROOT/resources/shellHelperFunctions.sh"

# This script runs from its own folder
cd "$THIS_SCRIPT_PATH"

WORKER_OUTPUT=build/obj
WORKER_OUTPUT_FILENAME=build/lib/worker-main.js

################################ Main script ################################

builder_describe \
  "Compiles the WebWorker module of Keyman's predictive-text engine as used for predictive text and autocorrective applications." \
  "@../keyman-version" \
  "@../../tools/sourcemap-path-remapper" \
  configure clean build test \
  "--ci      Runs unit tests with CI reporting" \
  "--debug   Includes full sources in the worker's sourcemap"

builder_describe_outputs \
  configure     /node_modules \
  build         build/lib/worker-main.wrapped.min.js

builder_parse "$@"

# TODO: build if out-of-date if test is specified
# TODO: configure if npm has not been run, and build is specified

if builder_start_action configure; then
  verify_npm_setup
  builder_finish_action success configure
fi

if builder_start_action clean; then
  npm run clean
  builder_finish_action success clean
fi

if builder_start_action build; then
  # Build worker with tsc first
  npm run build -- $builder_verbose || fail "Could not build worker."


  echo "Bundling worker modules"
  node build-bundler.js

  # Declaration bundling.
  npm run tsc -- --emitDeclarationOnly --outFile ./build/lib/index.d.ts
  npm run tsc -- --emitDeclarationOnly --outFile ./build/lib/worker-main.d.ts

  echo "Preparing the polyfills + worker for script-embedding"
  node build-polyfill-concatenator.js

  node build-wrap-and-minify.js --debug
  node build-wrap-and-minify.js --minify

  builder_finish_action success build
fi

if builder_start_action test; then
  MOCHA_FLAGS=

  if builder_has_option --ci; then
    MOCHA_FLAGS="$MOCHA_FLAGS --reporter mocha-teamcity-reporter"
  fi

  npm run mocha -- --recursive $MOCHA_FLAGS ./src/test/cases/

  builder_finish_action success test
fi
