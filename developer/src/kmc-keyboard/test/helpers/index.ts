/**
 * Helpers and utilities for the Mocha tests.
 */
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { SectionCompiler } from '../../src/compiler/section-compiler.js';
import { KMXPlus, LDMLKeyboardXMLSourceFileReader } from '@keymanapp/common-types';
import { CompilerEvent } from '../../src/compiler/callbacks.js';
import Compiler from '../../src/compiler/compiler.js';
import { assert } from 'chai';
import KMXPlusMetadataCompiler from '../../src/compiler/metadata-compiler.js';
import CompilerOptions from '../../src/compiler/compiler-options.js';

import KMXPlusFile = KMXPlus.KMXPlusFile;
import Elem = KMXPlus.Elem;
import GlobalSections = KMXPlus.GlobalSections;
import Section = KMXPlus.Section;
import Strs = KMXPlus.Strs;

/**
 * Builds a path to the fixture with the given path components.
 *
 * e.g., makePathToFixture('basic.xml')
 *
 * @param components One or more path components.
 */
export function makePathToFixture(...components: string[]): string {
  return fileURLToPath(new URL(path.join('..', '..', '..', 'test', 'fixtures', ...components), import.meta.url));
}

class CompilerCallbacks {
  messages: CompilerEvent[] = [];
  loadFile(baseFilename: string, filename:string): Buffer {
    // TODO: translate filename based on the baseFilename
    return fs.readFileSync(filename);
  }
  reportMessage(event: CompilerEvent): void {
    // console.log(event.message);
    this.messages.push(event);
  }
  loadLdmlKeyboardSchema(): Buffer {
    return fs.readFileSync(new URL(path.join('..', '..', 'src', 'ldml-keyboard.schema.json'), import.meta.url));
  }
  loadKvksJsonSchema(): Buffer {
    return fs.readFileSync(new URL(path.join('..', '..', 'src', 'kvks.schema.json'), import.meta.url));
  }
};

export const compilerTestCallbacks = new CompilerCallbacks();

beforeEach(function() {
  compilerTestCallbacks.messages = [];
});

afterEach(function() {
  if (this.currentTest.state !== 'passed') {
    compilerTestCallbacks.messages.forEach(message => console.log(message.message));
  }
});


export function loadSectionFixture(compilerClass: typeof SectionCompiler, filename: string, callbacks: CompilerCallbacks): Section {
  callbacks.messages = [];
  const inputFilename = makePathToFixture(filename);
  const data = callbacks.loadFile(inputFilename, inputFilename);
  assert.isNotNull(data);

  const reader = new LDMLKeyboardXMLSourceFileReader();
  const source = reader.load(data);
  assert.isNotNull(source);
  assert.doesNotThrow(() => {
    reader.validate(source, callbacks.loadLdmlKeyboardSchema());
  });

  const compiler = new compilerClass(source, callbacks);

  if(!compiler.validate()) {
    return null;
  }

  let globalSections: GlobalSections = {
    strs: new Strs(),
    elem: null
  };
  globalSections.elem = new Elem(globalSections.strs);

  return compiler.compile(globalSections);
}

export function compileKeyboard(inputFilename: string, options: CompilerOptions): KMXPlusFile {
  const k = new Compiler(compilerTestCallbacks, options);
  const source = k.load(inputFilename);
  checkMessages();
  assert.isNotNull(source, 'k.load should not have returned null');

  const valid = k.validate(source);
  checkMessages();
  assert.isTrue(valid, 'k.validate should not have failed');

  const kmx = k.compile(source);
  checkMessages();
  assert.isNotNull(kmx, 'k.compile should not have returned null');

  // In order for the KMX file to be loaded by non-KMXPlus components, it is helpful
  // to duplicate some of the metadata
  KMXPlusMetadataCompiler.addKmxMetadata(kmx.kmxplus, kmx.keyboard, options);

  return kmx;
}

export function checkMessages() {
  if(compilerTestCallbacks.messages.length > 0) {
    console.log(compilerTestCallbacks.messages);
  }
  assert.isEmpty(compilerTestCallbacks.messages);
}
