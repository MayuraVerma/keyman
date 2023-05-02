import * as KeymanOSK from '/@keymanapp/keyman/build/engine/osk/lib/index.mjs';
import Device from '/@keymanapp/keyman/build/engine/device-detect/lib/index.mjs';

import { loadKeyboardsFromStubs } from '../../kbdLoader.mjs';
import timedPromise from '../../timedPromise.mjs';

import sinon from '/node_modules/sinon/pkg/sinon-esm.js';

let assert = chai.assert;

const device = new Device();
device.detect();

const TestResources = {
  OskConfig: {
    isEmbedded: false,
    pathConfig: {
      fonts: '',
      resources: '/@keymanapp/keyman/src/resources'
    },
    hostDevice: device.coreSpec,
    allowHideAnimations: false // shortens timings.
  }
}

describe('OSK events', function () {
  this.timeout(__karma__.config.args.find((arg) => arg.type == "timeouts").standard);

  before(async () => {
    const stubs = [__json__['/keyboards/khmer_angkor']];
    TestResources.Keyboards = await loadKeyboardsFromStubs(stubs, '/');
  });

  beforeEach(() => {
    fixture.set('<div id="osk-container" style="width: fit-content"></div>');
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it('InlinedOSK - onHide / onShow', async () => {
    const container = document.getElementById('osk-container');

    let osk = new KeymanOSK.InlinedOSKView(TestResources.OskConfig);

    osk.setSize(600, 400);
    container.appendChild(osk.element);

    osk.activeKeyboard = TestResources.Keyboards['khmer_angkor'];

    // Needs a moment to actually load the stylesheets once visible - which occurs once first displayed.
    await timedPromise(100);

    // Assert the 'container' element's size matches what we set the OSK to.
    assert.equal(container.offsetWidth, 600);
    assert.equal(container.offsetHeight, 400);

    // Setup complete.

    // Hide the OSK + check for related event
    let hideStub = sinon.fake();
    let legacyHideStub = sinon.fake();
    osk.once('onhide', hideStub);
    osk.legacyEvents.addEventListener('hide', legacyHideStub);

    osk.activationModel.enabled = false;
    assert.isTrue(hideStub.calledOnce);
    assert.isTrue(legacyHideStub.calledOnce);

    // Show the OSK + check for related event
    let showStub = sinon.fake();
    // let legacyShowStub = sinon.fake();
    osk.once('onshow', showStub);
    // osk.once('legacyevent', legacyShowStub);

    osk.activationModel.enabled = true;
    assert.isTrue(showStub.calledOnce);
    // // Only called (at present) for "Floating" OSK views, given the event's parameterization.
    // assert.isTrue(legacyShowStub.calledOnce);
    // assert.equal(legacyShowStub.firstCall.args[0], 'osk.show');
  });
});