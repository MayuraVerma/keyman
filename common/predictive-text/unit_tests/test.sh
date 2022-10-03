#!/usr/bin/env bash

# We should work within the script's directory, not the one we were called in.
THIS_SCRIPT="$(greadlink -f "${BASH_SOURCE[0]}" 2>/dev/null || readlink -f "${BASH_SOURCE[0]}")"
. "$(dirname "$THIS_SCRIPT")/../../../resources/build/build-utils.sh"
## END STANDARD BUILD SCRIPT INCLUDE

. "$KEYMAN_ROOT/resources/build/build-utils-ci.inc.sh"
. "$KEYMAN_ROOT/resources/shellHelperFunctions.sh"
SCRIPT_ROOT="$(dirname "$THIS_SCRIPT")"

# This script runs from its own folder
cd "$SCRIPT_ROOT"

################################ Main script ################################

# Defaults
FLAGS="--require ./unit_tests/helpers"

builder_describe "Runs all tests for the language-modeling / predictive-text layer module" \
  "configure" \
  "test+" \
  ":libraries  Runs unit tests for in-repo libraries used by this module"\
  ":headless   Runs this module's headless user tests" \
  ":browser    Runs this module's browser-based user tests" \
  "--ci        Uses CI-based test configurations & emits CI-friendly test reports" \
  "--debug,-d  Activates developer-friendly debug mode for unit tests where applicable"

builder_parse "$@"

do_configure() {
  # Ensure all testing dependencies are in place.
  verify_npm_setup
}

CONFIGURED=

if builder_start_action configure :libraries; then
  # Ensure all testing dependencies are in place.
  do_configure
  CONFIGURED=configure:libraries
  builder_finish_action success configure :libraries
fi

if builder_start_action configure :headless; then
  if [ -n "$CONFIGURED" ]; then
    echo "Configuration already completed in ${BUILDER_TERM_START}${CONFIGURED}${BUILDER_TERM_END}; skipping."
  else
    do_configure
    CONFIGURED=configure:headless
  fi
  builder_finish_action success configure :headless
fi

if builder_start_action configure :browser; then
  if [[ -n "$CONFIGURED" ]]; then
    echo "Configuration already completed in ${BUILDER_TERM_START}${CONFIGURED}${BUILDER_TERM_END}; skipping."
  else
    do_configure
  fi
  builder_finish_action success configure :browser
fi

if builder_start_action test :libraries; then
  # Note:  these do not yet provide TeamCity-friendly-formatted test reports.
  # Sadly, appending them to the `npm run test` doesn't work; it'll require work in these modules.
  pushd "$KEYMAN_ROOT/common/models/wordbreakers"
  npm run test || fail "models/wordbreakers tests failed"
  popd

  pushd "$KEYMAN_ROOT/common/models/templates"
  npm run test || fail "models/templates tests failed"
  popd

  pushd "$KEYMAN_ROOT/common/models/types"
  # Is not mocha-based.
  npm run test || fail "models/types tests failed"
  popd

  builder_finish_action success test :libraries
fi

if builder_start_action test :headless; then
  MOCHA_FLAGS=$FLAGS

  if builder_has_option --ci; then
    MOCHA_FLAGS="$MOCHA_FLAGS --reporter mocha-teamcity-reporter"
  fi

  npm run mocha -- --recursive $MOCHA_FLAGS ./unit_tests/headless/*.js ./unit_tests/headless/**/*.js

  builder_finish_action success test :headless
fi

# If we are running a TeamCity test build, for now, only run BrowserStack
# tests when on a PR branch with a title including "(web)" or with the label
# test-browserstack. This is because the BrowserStack tests are currently
# unreliable, and the false positive failures are masking actual failures.
#
# We do not run BrowserStack tests on master, beta, or stable-x.y test
# builds.
if [[ $VERSION_ENVIRONMENT == test ]] && builder_has_action test :browser; then
  if builder_pull_get_details; then
    if ! ([[ $builder_pull_title =~ \(web\) ]] || builder_pull_has_label test-browserstack); then

      echo "Auto-skipping ${BUILDER_TERM_START}test:browser${BUILDER_TERM_END} for unrelated CI test build"
      exit 0
    fi
  fi
fi

get_browser_set_for_OS ( ) {
  if [ $os_id = "mac" ]; then
    BROWSERS="--browsers Firefox,Chrome,Safari"
  elif [ $os_id = "win" ]; then
    BROWSERS="--browsers Chrome"
  else
    BROWSERS="--browsers Firefox,Chrome"
  fi
}

if builder_start_action test :browser; then
  KARMA_FLAGS=$FLAGS
  KARMA_INFO_LEVEL="--log-level=warn"

  if builder_has_option --ci; then
    KARMA_FLAGS="$KARMA_FLAGS --reporters teamcity,BrowserStack"
    KARMA_CONFIG="CI.conf.js"
    KARMA_INFO_LEVEL="--log-level=debug"

    if builder_has_option --debug; then
      echo "${BUILDER_TERM_START}--ci${BUILDER_TERM_END} option set; ignoring ${BUILDER_TERM_START}--debug${BUILDER_TERM_END} option"
    fi
  else
    KARMA_CONFIG="manual.conf.js"
    if builder_has_option --debug; then
      KARMA_FLAGS="$KARMA_FLAGS --no-single-run"
      KARMA_CONFIG="manual.conf.js"
      KARMA_INFO_LEVEL="--log-level=debug"

      echo
      echo "${COLOR_YELLOW}You must manually terminate this mode (CTRL-C) for the script to exit.${COLOR_RESET}"
      sleep 2
    fi
  fi

  if [[ KARMA_CONFIG == "manual.conf.js" ]]; then
    get_builder_OS  # return:  os_id="linux"|"mac"|"win"
    get_browser_set_for_OS
  else
    BROWSERS=
  fi
  npm run karma -- start $KARMA_INFO_LEVEL $KARMA_FLAGS $BROWSERS unit_tests/in_browser/$KARMA_CONFIG

  builder_finish_action success test :browser
fi