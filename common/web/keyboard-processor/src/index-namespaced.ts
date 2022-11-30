// This file exists as a bundling intermediary that attempts to present all of
// keyboard-processor's offerings in the 'old', namespaced format - at least,
// as of the time that this submodule was converted to ES6 module use.

// Unfortunately, the declaration-bundling tool that works well for the modules...
// struggles a bit here.

import * as com from "./com-index.js";

// Make sure the declaration-merger code pays attention.
export * as com from "./com-index.js";

// Force-exports it as the global it always was.
com.keyman.utils.getGlobalObject()['com'] = com;
