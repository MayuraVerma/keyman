import { defaultApplyCasing,
         defaultCasedSearchTermToKey,
         defaultSearchTermToKey
       } from "./model-defaults";

const KEYMAN_VERSION = require("@keymanapp/keyman-version/build/version.inc.cjs");

/**
 * Processes certain defined model behaviors in such a way that the needed closures
 * may be safely compiled to a JS file and loaded within the LMLayer.
 *
 * This is accomplished by writing out a 'pseudoclosure' within the model's IIFE,
 * then used to build _actual_ closures at LMLayer load time.  This 'pseudoclosure'
 * will very closely match the organizational patterns of this class in order to
 * facilitate the maintenance of this approach.
 */
export class ModelDefinitions {
  static readonly COMPILED_NAME = 'definitions';
  /**
   * A closure fully implementing the model's defined `applyCasing` behavior with
   * the function parameter preset to the version-appropriate default.
   * `defaults.applyCasing` is captured as part of the closure.
   *
   * During compilation of some models (such as Trie-based wordlist templated models),
   * this closure will be directly used as part of searchTermToKey.
   *
   * In compiled code, this will instead be defined in-line as an autogenerated closure
   * using the other properties of the pseudoclosure.
   */
  applyCasing?: CasingFunction;

  /**
   * A closure fully implementing the model's defined `searchTermToKey` behavior
   * based upon the model's specified casing rules.  The `applyCasing` closure is
   * itself captured within this closure.
   *
   * During compilation of some models (such as Trie-based wordlist templated models),
   * this closure will be directly utilized when compiling the lexicon.
   *
   * In compiled code, this will instead be defined in-line as an autogenerated closure
   * using the other properties of the pseudoclosure.
   */
  searchTermToKey?: WordformToKeySpec;

  /**
   * Contains embedded 'default' implementations that may be needed for
   * closures in the compiled version, annotated with the current version
   * of Developer.
   */
  private defaults: {
    version: string;
    applyCasing?: CasingFunction;
  } = {
    version: KEYMAN_VERSION.VERSION_WITH_TAG
  };

  /**
   * Contains the model-specific definitions specified in the model's source.
   *
   * These definitions may expect `defaults.applyCasing` as a parameter in
   * their final closures.
   */
  private model: {
    applyCasing?: CasingFunction;
    searchTermToKey?: WordformToKeySpec;
  } = {};

  constructor(modelSource: LexicalModelSource) {
    // Determine the model's `applyCasing` function / implementation.
    if(modelSource.languageUsesCasing) {
      this.defaults.applyCasing = defaultApplyCasing;

      if(modelSource.applyCasing) {
        this.model.applyCasing = modelSource.applyCasing;
        let _this = this;

        // Since the defined casing function may expect to take our default implementation
        // as a parameter, we can define the full implementation via closure capture.
        this.applyCasing = function(casing: CasingForm, text: string) {
          return _this.model.applyCasing(casing, text, _this.defaults.applyCasing);
        };
      } else {
        this.applyCasing = this.defaults.applyCasing;
      }
    }

    // START: if(model type uses keying)...

    // Use the default search term to key function, if left unspecified.
    if(modelSource.searchTermToKey) {
      this.model.searchTermToKey = modelSource.searchTermToKey;
    } else if(modelSource.languageUsesCasing) {
      // applyCasing is defined here.
      // Unfortunately, this only works conceptually.  .toString on a closure
      // does not result in proper compilation.
      this.model.searchTermToKey = defaultCasedSearchTermToKey;
    } else if(modelSource.languageUsesCasing == false) {
      this.model.searchTermToKey = defaultSearchTermToKey;
    } else {
      // If languageUsesCasing is not defined, then we use pre-14.0 behavior,
      // which expects a lowercased default.
      this.model.searchTermToKey = defaultCasedSearchTermToKey;
      // Needed to provide pre-14.0 default lowercasing as part of the
      // search-term keying operation.
      this.defaults.applyCasing = defaultApplyCasing;
      // For compile-time use.
      this.applyCasing = this.defaults.applyCasing;
    }

    let _this = this;
    this.searchTermToKey = function(text: string) {
      return _this.model.searchTermToKey(text, _this.applyCasing);
    }

    // END: if(model type uses keying)...
  }

  // ------------ end:  common compile-time / run-time code ---------------

  // START:  handwritten compilation code (to accomplish the 'common' pattern defined above)

  /**
   * Writes out a compiled JS version of the pseudoclosure, preserving all function
   * implementations.
   *
   * This should be written to the file within the same IIFE as the model but BEFORE
   * the model itself, as the model will need to refer to the definitions herein.
   */
  compileDefinitions(): string {
    let defn: string = '';
    defn += `var ${PSEUDOCLOSURE} = {\n`

    // ----------------------
    // START - the 'defaults', which are common within the same Developer version.
    defn += `  defaults: {\n    version: "${this.defaults.version}"`;

    // Only write out `applyCasing` if and when it is needed.
    if(this.defaults.applyCasing) {
      defn += `,\n    applyCasing: ${this.defaults.applyCasing.toString()}`;
    }

    // Finalizes `defaults`
    defn += `\n  },`;
    // END - the 'defaults'

    // ----------------------
    // START - model-specific definitions (when defined)
    defn += `  model: {\n`;
    defn += `    searchTermToKey: ${this.model.searchTermToKey.toString()}`;

    if(this.model.applyCasing) {
      defn += `,\n    applyCasing: ${this.model.applyCasing.toString()}`;
    }
    defn += `\n  }`
    // END - model-specific definitions

    // ----------------------
    // START - compiled closures.  Given those definitions, write out the
    // pseudoclosure-referencing closures for the needed methods.

    // We should be able to define these closures in-line with the object's
    // initialization.  Worst-case, we simply move the definitions outside
    // of the pseudoclosure's init and THEN define/assign these closures to
    // the object, as references will be available then for sure.
    if(this.model.applyCasing) {
      // A major potential issue:  if the user wants to call extra custom functions that they've written.
      //
      // `applyCasing` recursion SHOULD be fine if they write `this.applyCasing() and forward all arguments
      // appropriately, as it will be known as `applyCasing` on the runtime `this` (`model`) object.
      //
      // Similarly, as long as any helper functions are similarly compiled and stored as part of `model`,
      // they should be accessible too.  The issue would be to actually allow use of extra custom funcs
      // and include them as part of this object as part of compilation.
      defn += `,\n  applyCasing: function(caseToApply, text) {
        return ${PSEUDOCLOSURE}.model.applyCasing(caseToApply, text, ${PSEUDOCLOSURE}.defaults.applyCasing);
      }`;
    } else if(this.defaults.applyCasing) {
      // We can't directly assign from `.defaults`, as initialization-time field reads
      // are not permitted within JS.  Function references, however, are valid.
      defn += `,\n  applyCasing: function(caseToApply, text) {
        return ${PSEUDOCLOSURE}.defaults.applyCasing(caseToApply, text);
      }`;
    }

    // if(this.searchTermToKey) {
    defn += `,\n  searchTermToKey: function(text) {
      return ${PSEUDOCLOSURE}.model.searchTermToKey(text, ${PSEUDOCLOSURE}.applyCasing);
    }`;
    // }

    // END - compiled closures.

    // ----------------------
    // Finalize the definition of... `definitions`.
    defn += `\n};\n`;

    return defn;
  }

  /**
   * Compiles the model-options entry for `searchTermToKey` in reference to the
   * compiled pseudoclosure.
   */
  compileSearchTermToKey(): string {
    // Simply point the model to the constructed closure defined by `compilePseudoclosure`.
    // See "START - compiled closures" section.
    return `${PSEUDOCLOSURE}.searchTermToKey`;
  }

  /**
   * Compiles the model-options entry for `applyCasing` in reference to the
   * compiled pseudoclosure.
   */
  compileApplyCasing(): string {// Simply point the model to the constructed closure defined by `compilePseudoclosure`.
    // See "START - compiled closures" section.
    return `${PSEUDOCLOSURE}.applyCasing`;
  }
}

// Because it references the class field, this line must come afterward.
const PSEUDOCLOSURE = ModelDefinitions.COMPILED_NAME;