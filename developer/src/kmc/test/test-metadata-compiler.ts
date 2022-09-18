import 'mocha';
import {assert} from 'chai';
import { checkMessages, compileKeyboard, CompilerCallbacks, makePathToFixture } from './helpers';
import KMXFile from '../src/keyman/kmx/kmx';

const KEYMAN_VERSION = require("@keymanapp/keyman-version").KEYMAN_VERSION;

describe('kmx metadata compiler', function () {
  this.slow(500); // 0.5 sec -- json schema validation takes a while

  it('should compile metadata with debug and compiler version', function() {
    debugger
        const callbacks = new CompilerCallbacks();
    const inputFilename = makePathToFixture('basic.xml');

    // Compile the keyboard
    const kmx = compileKeyboard(inputFilename, callbacks, {debug:true, addCompilerVersion:true});
    checkMessages(callbacks);
    assert.isNotNull(kmx);

    // Order of stores is not significant in kmx spec, but kmxplus compiler will
    // always store according to dwSystemID binary order for non-zero
    // dwSystemID, then by dpName binary order, and finally by dpString binary
    // order

    // TSS_NAME = 7
    // TSS_COMPILEDVERSION = 20
    // TSS_KEYBOARDVERSION = 36
    // TSS_TARGETS = 38

    assert.equal(kmx.keyboard.stores[0].dpName, '&NAME');
    assert.equal(kmx.keyboard.stores[0].dpString, 'TestKbd');
    assert.equal(kmx.keyboard.stores[0].dwSystemID, KMXFile.TSS_NAME);

    assert.equal(kmx.keyboard.stores[1].dpName, '');
    assert.equal(kmx.keyboard.stores[1].dpString, KEYMAN_VERSION.VERSION_WITH_TAG);
    assert.equal(kmx.keyboard.stores[1].dwSystemID, KMXFile.TSS_COMPILEDVERSION);

    assert.equal(kmx.keyboard.stores[2].dpName, '&KEYBOARDVERSION');
    assert.equal(kmx.keyboard.stores[2].dpString, '1.0.0');
    assert.equal(kmx.keyboard.stores[2].dwSystemID, KMXFile.TSS_KEYBOARDVERSION);

    assert.equal(kmx.keyboard.stores[3].dpName, '&TARGETS');
    assert.equal(kmx.keyboard.stores[3].dpString, 'desktop');
    assert.equal(kmx.keyboard.stores[3].dwSystemID, KMXFile.TSS_TARGETS);
  });

  it('should compile metadata with no compiler version', function() {
    const callbacks = new CompilerCallbacks();
    const inputFilename = makePathToFixture('basic.xml');

    // Compile the keyboard
    const kmx = compileKeyboard(inputFilename, callbacks, {debug:true, addCompilerVersion:false});
    checkMessages(callbacks);
    assert.isNotNull(kmx);

    // TSS_NAME = 7
    // -- TSS_COMPILEDVERSION = 20 -- not included with addCompilerVersion = false
    // TSS_KEYBOARDVERSION = 36
    // TSS_TARGETS = 38

    assert.equal(kmx.keyboard.stores[0].dpName, '&NAME');
    assert.equal(kmx.keyboard.stores[0].dpString, 'TestKbd');
    assert.equal(kmx.keyboard.stores[0].dwSystemID, KMXFile.TSS_NAME);

    assert.equal(kmx.keyboard.stores[1].dpName, '&KEYBOARDVERSION');
    assert.equal(kmx.keyboard.stores[1].dpString, '1.0.0');
    assert.equal(kmx.keyboard.stores[1].dwSystemID, KMXFile.TSS_KEYBOARDVERSION);

    assert.equal(kmx.keyboard.stores[2].dpName, '&TARGETS');
    assert.equal(kmx.keyboard.stores[2].dpString, 'desktop');
    assert.equal(kmx.keyboard.stores[2].dwSystemID, KMXFile.TSS_TARGETS);
  });

});

