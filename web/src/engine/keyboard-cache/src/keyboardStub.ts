import {
  type KeyboardAPIPropertySpec as APISimpleKeyboard,
  type KeyboardAPIPropertyMultilangSpec as APICompoundKeyboard,
  KeyboardProperties,
  type LanguageAPIPropertySpec,
} from '@keymanapp/keyboard-processor';
import { toPrefixedKeyboardId as prefixed } from './stubAndKeyboardCache.js';


// Language regions as defined by cloud server
export const REGIONS = ['World','Africa','Asia','Europe','South America','North America','Oceania','Central America','Middle East'];
export const REGION_CODES = ['un','af','as','eu','sa','na','oc','ca','me'];

export type KeyboardAPISpec = (APISimpleKeyboard | APICompoundKeyboard) & {
  displayName?: string;
  filename: string
};

export interface RawKeyboardStub extends KeyboardStub {};

export default class KeyboardStub extends KeyboardProperties {
  KR: string;
  KRC: string;
  KF: string;

  KP?: string;

  public constructor(rawStub: RawKeyboardStub);
  public constructor(apiSpec: APISimpleKeyboard & { filename: string }, keyboardBaseUri?: string, fontBaseUri?: string);
  public constructor(kbdId: string, lngId: string);
  constructor(arg0: string | RawKeyboardStub | (APISimpleKeyboard & { filename: string }), arg1?: string, arg2?: string) {
    if(typeof arg0 !== 'string') {
      if(arg0.id !== undefined) {
        let apiSpec = arg0 as APISimpleKeyboard & { filename: string };
        apiSpec.id = prefixed(apiSpec.id);
        super(apiSpec, arg2);
        this.KF = apiSpec.filename;
        this.mapRegion(apiSpec.languages);

        /*
         * Detects the following patterns (at minimum):
         * ../file (but not .../file)
         * ./file
         * /file
         * http:// (on the colon)
         * hello:world (on the colon) - that one miiiight be less intentional, though.
         *
         * Essentially, detects absolute paths and paths explicitly relative to the host page's URI.
         *
         * Alternative clearer version - '^(\.{0,2}/)|(:)'
         * Unless backslashes should be able to replace dots?
         */
        let rx=RegExp('^(([\\.]/)|([\\.][\\.]/)|(/))|(:)');

        arg1 = arg1 || '';
        if(!rx.test(this.KF)) {
          this.KF = arg1 + this.KF;
        }
      } else {
        let rawStub = arg0 as RawKeyboardStub;
        rawStub.KI = prefixed(rawStub.KI);
        super(rawStub);

        this.KF = rawStub.KF;
        this.KP = rawStub.KP;
        this.KR = rawStub.KR;
        this.KRC = rawStub.KRC;
        return;
      }
    } else {
      super(prefixed(arg0), arg1);
    }
  }

  private mapRegion(language: LanguageAPIPropertySpec) {
    // Accept region as number (from Cloud server), code, or name
    const region=language.region;
    let rIndex=0;
    if(typeof(region) == 'number') {
      if(region < 1 || region > 9) {
        rIndex = 0;
      } else {
        rIndex = region-1;
      }
    } else if(typeof(region) == 'string') {
      let list = (region.length == 2 ? REGION_CODES : REGIONS);
      for(let i=0; i<list.length; i++) {
        if(region.toLowerCase() == list[i].toLowerCase()) {
          rIndex=i;
          break;
        }
      }
    }

    this.KR = REGIONS[rIndex];
    this.KRC = REGION_CODES[rIndex];
  }

  get region(): string {
    return this.KR;
  }

  get regionCode(): string {
    return this.KRC;
  }

  get filename(): string {
    return this.KF;
  }

  /**
   * Utility to convert API 'stubs' to internal KeyboardStub[]
   * @param arg
   * @returns (KeyboardStub|ErrorStub)[]
   */
  public static toStubs(arg: KeyboardAPISpec, keyboardBaseUri: string, fontBaseUri: string): (KeyboardStub|ErrorStub)[] {
    let errorMsg: string = '';

    if(typeof(arg.language) != "undefined") {
      console.warn("The 'language' property for keyboard stubs has been deprecated.  Please use the 'languages' property instead.");
    }
    arg.languages ||= arg.language;

    if (!arg) {
      errorMsg = "Stub undefined";
    } else if (!arg.id) {
      errorMsg = "KeyboardStub has undefined id";
    } else if (!arg.languages) {
      errorMsg = "KeyboardStub has undefined languages"
    }
    if (errorMsg != '') {
      return [{error: new Error(errorMsg)}];
    }

    // We have a valid API object to convert over.

    // Extract all the languages
    let languages: LanguageAPIPropertySpec[] = [];
    if (!Array.isArray(arg.languages)) {
      languages.push(arg.languages);
    } else {
      languages = languages.concat(arg.languages);
    }

    let stubs: KeyboardStub[] = [];
    languages.forEach(language => {
      // The deprecated `language` is assigned to satisfy TS type-checking.
      const intermediate = {...arg, languages: language, language: undefined};
      const stub: KeyboardStub = new KeyboardStub(intermediate, keyboardBaseUri, fontBaseUri);

      stubs.push(stub);
    })

    return stubs;
  }

  public merge(stub: KeyboardStub) {
    this.KL ||= stub.KL;
    this.KR ||= stub.KR;
    this.KRC ||= stub.KRC;
    this.KN ||= stub.KN;
    this.displayName ||= stub.displayName;
    this.KF ||= stub.KF;
    this.KFont ||= stub.KFont;
    this.KOskFont ||= stub.KOskFont;
  }

  public validateForCustomKeyboard(): Error {
    if(super.validateForCustomKeyboard() || !this.KF || !this.KR) {
      return new Error('To use a custom keyboard, you must specify file name, keyboard id, keyboard name, language, language code, and region.');
    } else {
      return null;
    }
  }
}

// Information about a keyboard that fails to get added
export interface ErrorStub {
  keyboard?: {
    id: string;
    name: string;
  },
  language?: {
    id?: string;
    name?: string;
  }

  error: Error;
}

export function mergeAndResolveStubPromises(keyboardStubs: (KeyboardStub|ErrorStub)[], errorStubs: ErrorStub[]) :
  Promise<(KeyboardStub|ErrorStub)[]> {
  if (errorStubs.length == 0) {
    return Promise.resolve(keyboardStubs);
  } if (keyboardStubs.length == 0) {
    return Promise.reject(errorStubs);
  } else {
    // Merge this with errorStubs
    let result: (KeyboardStub|ErrorStub)[] = keyboardStubs;
    return Promise.resolve(result.concat(errorStubs));
  }
}