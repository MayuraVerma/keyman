#!/usr/bin/env bash

## START STANDARD BUILD SCRIPT INCLUDE
# adjust relative paths as necessary
THIS_SCRIPT="$(readlink -f "${BASH_SOURCE[0]}")"
. "${THIS_SCRIPT%/*}/../resources/build/build-utils.sh"
## END STANDARD BUILD SCRIPT INCLUDE

# This script runs from its own folder
cd "$(dirname "$THIS_SCRIPT")"

# Include our resource functions; they're pretty useful!
. "$KEYMAN_ROOT/resources/shellHelperFunctions.sh"

# Please note that this build script (understandably) assumes that it is running on Mac OS X.
verify_on_mac

builder_describe "Builds Keyman Engine and the Keyman app for use on iOS devices - iPhone and iPad." \
  "clean" \
  "configure" \
  "build" \
  ":engine          Builds KeymanEngine.xcframework, usable by our main app and by third-party apps" \
  ":app=keyman      Builds the Keyman app for iOS platforms" \
  "--debug+         Avoids codesigning and adds full sourcemaps for the embedded predictive-text engine" \
  "--sim-artifact+  Also outputs a simulator-friendly test artifact corresponding to the build"

builder_parse "$@"

builder_run_child_actions clean configure build