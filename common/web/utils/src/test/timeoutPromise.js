import { assert } from 'chai';

import { TimeoutPromise } from '@keymanapp/web-utils';

// Set this long enough to allow a bit of delay from OS context-switching (often on the
// order of ~16ms for some OSes) to occur multiple times without breaking these tests.
const INTERVAL = 160;

describe("TimeoutPromise", () => {
  it('standard use', async () => {
    const start = Date.now();
    const promise = new TimeoutPromise(INTERVAL);

    assert.isTrue(await promise.corePromise);

    const end = Date.now();
    assert.isAtLeast(end-start, INTERVAL);
  });

  it('simple early fulfillment', async () => {
    const start = Date.now();
    const promise = new TimeoutPromise(INTERVAL);

    promise.resolve(true);

    assert.isTrue(await promise.corePromise);

    const end = Date.now();
    assert.isAtMost(end-start, INTERVAL-1);  // completes early
  });

  it('early cancellation', async () => {
    const start = Date.now();
    const promise = new TimeoutPromise(INTERVAL);
    const uncancelledPromise = new TimeoutPromise(INTERVAL);

    promise.resolve(false);

    assert.isFalse(await promise.corePromise);

    const end = Date.now();
    assert.isAtMost(end-start, INTERVAL-1);  // completes early

    await uncancelledPromise;

    // The internal timeout function calls `resolve(true)`, but we cancelled.
    // That call is late, post-settle... so it should not change what `then` receives.
    assert.isFalse(await promise.corePromise);
  });

  it('complex early fulfillment', async () => {
    const start = Date.now();
    const promise = new TimeoutPromise(INTERVAL);

    let delayedResolver = new TimeoutPromise(INTERVAL/2);
    delayedResolver.then(() => promise.resolve(true));

    assert.isTrue(await promise.corePromise);

    const end = Date.now();
    assert.isAtMost(end-start, INTERVAL-1);  // completes early
    assert.isAtLeast(end-start, INTERVAL/2); // but not TOO early
  });

  it('late dual fulfillment does not change first result', async () => {
    const start = Date.now();
    const promise = new TimeoutPromise(INTERVAL);

    assert.isTrue(await promise.corePromise);

    const end = Date.now();
    assert.isAtLeast(end-start, INTERVAL);

    promise.resolve(false);

    assert.isTrue(await promise);
  });
});