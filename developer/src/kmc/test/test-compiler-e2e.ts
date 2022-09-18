import 'mocha';
import {assert} from 'chai';
import hextobin from '@keymanapp/hextobin';
import KMXBuilder from '../src/keyman/kmx/kmx-builder';
import {checkMessages, compileKeyboard, CompilerCallbacks, makePathToFixture} from './helpers/index';

describe('compiler-tests', function() {
  this.slow(500); // 0.5 sec -- json schema validation takes a while

  it('should-build-fixtures', async function() {
    // Let's build basic.xml
    // It should match basic.kmx (built from basic.txt)

    const inputFilename = makePathToFixture('basic.xml');
    const binaryFilename = makePathToFixture('basic.txt');

    // Compile the keyboard
    const callbacks = new CompilerCallbacks();
    const kmx = compileKeyboard(inputFilename, callbacks, {debug: true, addCompilerVersion: false});
    assert.isNotNull(kmx);

    // Use the builder to generate the binary output file
    const builder = new KMXBuilder(kmx, true);
    const code = builder.compile();
    checkMessages(callbacks);
    assert.isNotNull(code);

    // Compare output
    let expected = await hextobin(binaryFilename, undefined, {silent:true});
    assert.deepEqual<Uint8Array>(code, expected);
  });
});