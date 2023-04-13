import { Keyboard, KeyboardLoaderBase as KeyboardLoader } from "@keymanapp/keyboard-processor";
import EventEmitter from "eventemitter3";
import { type PathConfiguration } from "keyman/engine/paths";

import KeyboardStub from "./keyboardStub.js";

const KEYBOARD_PREFIX = "Keyboard_";

function prefixed(text: string) {
  if(!text.startsWith(KEYBOARD_PREFIX)) {
    return KEYBOARD_PREFIX + text;
  } else {
    return text;
  }
}

export {prefixed as toPrefixedKeyboardId};

function withoutPrefix(text: string) {
  if(text.startsWith(KEYBOARD_PREFIX)) {
    return text.substring(KEYBOARD_PREFIX.length);
  } else {
    return text;
  }
}

export {withoutPrefix as toUnprefixedKeyboardId};

interface EventMap {
  /**
   * Indicates that the specified stub has just been registered within the cache.
   *
   * Note for future hook:  establish a listener for this event during engine init
   * to denote the first added stub to facilitate auto-activation of the first
   * keyboard to be registered.
   */
  stubAdded: (stub: KeyboardStub) => void;

  /**
   * Indicates that the specified Keyboard has just been added to the cache.
   */
  keyboardAdded: (keyboard: Keyboard) => void;
}

export default class StubAndKeyboardCache extends EventEmitter<EventMap> {
  private stubSetTable: Record<string, Record<string, KeyboardStub>> = {};
  private keyboardTable: Record<string, Keyboard | Promise<Keyboard>> = {};

  private readonly keyboardLoader: KeyboardLoader;

  constructor(keyboardLoader?: KeyboardLoader) {
    super();
    this.keyboardLoader = keyboardLoader;
  }

  getKeyboardForStub(stub: KeyboardStub): Keyboard {
    return this.getKeyboard(stub.KI);
  }

  getKeyboard(keyboardID: string): Keyboard {
    const entry = this.keyboardTable[prefixed(keyboardID)];

    // Unit testing may 'trip up' in the DOM, as bundled versions of a class from one bundled
    // module will fail against an `instanceof` expecting the version bundled in a second.
    //
    // Thus, we filter based on `Promise`, which needs no module.
    return entry instanceof Promise ? null : entry;
  }

  get defaultStub(): KeyboardStub {
    /* See the following two StackOverflow links:
     * - https://stackoverflow.com/a/23202095
     * - https://stackoverflow.com/a/5525820
     *
     * Also: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Object/values#description
     *
     * As keyboard IDs are never purely numeric, any sufficiently-recent browser will
     * maintain the order in which stubs were added to this cache.
     *
     * Note that if a keyboard is removed, its matching stubs are also removed, so the next most-recent
     * property will take precedence.
     *
     * Might possibly fail to return the oldest registered stub for the oldest of supported browsers
     * (i.e, Android 5.0), but will work for anything decently recent.  Even then... we still supply
     * _a_ keyboard.  Just not in a way that will seem deterministic/controllable to site designers.
     */
    const entries = Object.values(this.stubSetTable);
    if(entries.length == 0) {
      return undefined;
    } else {
      // Maps language codes to actual KeyboardStub entries.  So... "stub table for the oldest registered keyboard".
      const stubTable = entries[0];
      // First value = first registered stub for that first keyboard.
      // Does not consider later-added stubs, but neither does removeKeyboard - removal is "all or nothing".
      return Object.values(stubTable)[0]; // returns undefined if it does not exist.
    }
  }

  addKeyboard(keyboard: Keyboard) {
    const keyboardID = prefixed(keyboard.id);
    this.keyboardTable[keyboardID] = keyboard;

    this.emit('keyboardAdded', keyboard);
  }

  fetchKeyboardForStub(stub: KeyboardStub) : Promise<Keyboard> {
    return this.fetchKeyboard(stub.KI);
  }

  fetchKeyboard(keyboardID: string): Promise<Keyboard> {
    if(!keyboardID) {
      throw new Error("Keyboard ID must be specified");
    }

    if(!this.keyboardLoader) {
      throw new Error("Cannot load keyboards; this cache was configured without a loader");
    }

    keyboardID = prefixed(keyboardID);

    const cachedEntry = this.keyboardTable[keyboardID];
    if(cachedEntry instanceof Keyboard) {
      return Promise.resolve(cachedEntry);
    } else if(cachedEntry instanceof Promise) {
      return cachedEntry;
    }

    const stub = this.getStub(keyboardID, null);
    if(!stub) {
      throw new Error(`No stub for ${withoutPrefix(keyboardID)} has been registered`);
    }

    if(!stub.filename) {
      throw new Error(`The registered stub for ${withoutPrefix(keyboardID)} lacks a path to the main keyboard file`);
    }

    const promise = this.keyboardLoader.loadKeyboardFromStub(stub);
    this.keyboardTable[keyboardID] = promise;

    promise.then((kbd) => {
      // Overrides the built-in ID in case of keyboard namespacing.
      kbd.scriptObject["KI"] = keyboardID;
      this.addKeyboard(kbd);
    }).catch((err) => {
      delete this.keyboardTable[keyboardID];
      throw err;
    })

    return promise;
  }

  addStub(stub: KeyboardStub) {
    const keyboardID = prefixed(stub.KI);
    const stubTable = this.stubSetTable[keyboardID] = this.stubSetTable[keyboardID] ?? {};
    stubTable[stub.KLC] = stub;

    this.emit('stubAdded', stub);
  }

  findMatchingStub(stub: KeyboardStub) {
    return this.getStub(stub.KI, stub.KLC);
  }

  getStub(keyboardID: string, languageID: string): KeyboardStub;
  getStub(keyboard: Keyboard, languageID?: string): KeyboardStub;
  getStub(arg0: string | Keyboard, arg1?: string): KeyboardStub {
    let keyboardID: string;
    let languageID = arg1 || '---';

    if(arg0 instanceof Keyboard) {
      keyboardID = arg0.id;
    } else {
      keyboardID = arg0;
    }

    keyboardID = prefixed(keyboardID);

    const stubTable = this.stubSetTable[keyboardID] ?? {};

    if(languageID != '---') {
      return stubTable[languageID];
    } else {
      const keys = Object.keys(stubTable);
      if(keys.length == 0) {
        return null;
      } else {
        return stubTable[keys[0]];
      }
    };
  }

  /**
   * Removes all metadata (stubs) associated with a specific keyboard from the cache, optionally
   * removing the cached keyboard as well.
   * @param keyboard Either the keyboard ID or `Keyboard` instance
   * @param purge If `true`, will also purge the `Keyboard` instance itself from the cache.
   *              If `false`, only forgets the metadata (stubs).
   */
  forgetKeyboard(keyboard: string | Keyboard, purge: boolean = false) {
    let id: string = (keyboard instanceof Keyboard) ? keyboard.id : keyboard;

    if(this.stubSetTable[id]) {
      delete this.stubSetTable[id];
    }

    if(purge && this.keyboardTable[id]) {
      delete this.keyboardTable[id];
    }
  }
}