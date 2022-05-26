var assert = require('chai').assert;
let fs = require('fs');
let vm = require('vm');

let KeyboardProcessor = com.keyman.text.KeyboardProcessor;
global.keyman = {};
global.com = com;

// Initialize supplementary plane string extensions
String.kmwEnableSupplementaryPlane(false);

describe('Engine - Deadkeys', function() {
  let testJSONtext = fs.readFileSync('../tests/resources/json/engine_tests/deadkeys.json');
  // Common test suite setup.
  let testSuite = new KMWRecorder.KeyboardTest(JSON.parse(testJSONtext));

  var keyboard;
  let device = {
    formFactor: 'desktop',
    OS: 'windows',
    browser: 'native'
  }

  before(function() {
    // -- START: Standard Recorder-based unit test loading boilerplate --
    // Load the keyboard.  We'll need a KeyboardProcessor instance as an intermediary.
    let kp = new KeyboardProcessor();

    // These two lines will load a keyboard from its file; headless-mode `registerKeyboard` will
    // automatically set the keyboard as active.
    var script = new vm.Script(fs.readFileSync('../tests/' + testSuite.keyboard.filename));
    script.runInThisContext();

    keyboard = kp.activeKeyboard;
    assert.equal(keyboard.id, "Keyboard_" + testSuite.keyboard.id);
    // --  END:  Standard Recorder-based unit test loading boilerplate --

    // This part provides extra assurance that the keyboard properly loaded.
    assert.equal(keyboard.id, "Keyboard_test_deadkeys");
  });

  // Converts each test set into its own Mocha-level test.
  for(let set of testSuite.inputTestSets) {
    let proctor = new KMWRecorder.NodeProctor(keyboard, device, assert.equal);

    if(!proctor.compatibleWithSuite(testSuite)) {
      it.skip(set.toTestName() + " - Cannot run this test suite on Node.");
    } else {
      it(set.toTestName(), function() {
        // Refresh the proctor instance at runtime.
        let proctor = new KMWRecorder.NodeProctor(keyboard, device, assert.equal);
        set.test(proctor);
      });
    }
  }
});