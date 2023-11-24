import { Keyboard, KeyboardProperties } from '@keymanapp/keyboard-processor';
import { type PredictionContext } from '@keymanapp/input-processor';
import {
  GestureRecognizer,
  GestureRecognizerConfiguration,
  GestureSource,
  InputSample,
  PaddedZoneSource
} from '@keymanapp/gesture-recognizer';
import { BANNER_GESTURE_SET } from './bannerGestureSet.js';
import { createUnselectableElement } from 'keyman/engine/dom-utils';

// Base class for a banner above the keyboard in the OSK

export abstract class Banner {
  private _height: number; // pixels
  private div: HTMLDivElement;

  public static DEFAULT_HEIGHT: number = 37; // pixels; embedded apps can modify

  public static readonly BANNER_CLASS: string = 'kmw-banner-bar';
  public static readonly BANNER_ID: string = 'kmw-banner-bar';

  /**
   * Function     height
   * Scope        Public
   * @returns     {number} height in pixels
   * Description  Returns the height of the banner in pixels
   */
  public get height(): number {
    return this._height;
  }

  /**
   * Function     height
   * Scope        Public
   * @param       {number} height   the height in pixels
   * Description  Sets the height of the banner in pixels. If a negative
   *              height is given, set height to 0 pixels.
   *              Also updates the banner styling.
   */
  public set height(height: number) {
    this._height = (height > 0) ?  height : 0;
    this.update();
  }

  /**
   * Function      update
   * @return       {boolean}   true if the banner styling changed
   * Description   Update the height and display styling of the banner
   */
  protected update() : boolean {
    let ds = this.div.style;
    let currentHeightStyle = ds.height;
    let currentDisplayStyle = ds.display;

    if (this._height > 0) {
      ds.height = this._height + 'px';
      ds.display = 'block';
    } else {
      ds.height = '0px';
      ds.display = 'none';
    }

    return (!(currentHeightStyle === ds.height) ||
      !(currentDisplayStyle === ds.display));
  }

  public constructor(height?: number) {
    let d = createUnselectableElement('div');
    d.id = Banner.BANNER_ID;
    d.className = Banner.BANNER_CLASS;
    this.div = d;

    this.height = height;
    this.update();
  }

  public appendStyleSheet() {
    // TODO: add stylesheets
    // See VisualKeyboard's method + 'addFontStyle' for current handling.
  }

  /**
   * Function     getDiv
   * Scope        Public
   * @returns     {HTMLElement} Base element of the banner
   * Description  Returns the HTMLElelemnt of the banner
   */
  public getDiv(): HTMLElement {
    return this.div;
  }

  /**
   * Allows banners to adapt based on the active keyboard and related properties, such as
   * associated fonts.
   * @param keyboard
   * @param keyboardProperties
   */
  public configureForKeyboard(keyboard: Keyboard, keyboardProperties: KeyboardProperties) { }

  abstract get type();

  get suggestion(): Suggestion {
    return this._suggestion;
  }

  /**
   * Function update
   * @param {string}     id           Element ID for the suggestion span
   * @param {Suggestion} suggestion   Suggestion from the lexical model
   * Description  Update the ID and text of the BannerSuggestionSpec
   */
  public update(suggestion: Suggestion) {
    this._suggestion = suggestion;
    this.updateText();
  }

  private updateText() {
    let display = this.generateSuggestionText(this.rtl);
    this.div.replaceChild(display, this.display);
    this.display = display;
  }

  public highlight(on: boolean) {
    const elem = this.div;
    let classes = elem.className;
    let cs = ' ' + SuggestionBanner.TOUCHED_CLASS;

    if(on && classes.indexOf(cs) < 0) {
      elem.className=classes+cs;
    } else {
      elem.className=classes.replace(cs,'');
    }
  }

  public isEmpty(): boolean {
    return !this._suggestion;
  }

  /**
   * Function generateSuggestionText
   * @return {HTMLSpanElement}  Span element of the suggestion
   * Description   Produces a HTMLSpanElement with the key's actual text.
   */
  //
  public generateSuggestionText(rtl: boolean): HTMLSpanElement {
    let suggestion = this._suggestion;
    var suggestionText: string;

    var s=createUnselectableElement('span');
    s.className = 'kmw-suggestion-text';

    if(suggestion == null) {
      return s;
    }

    if(suggestion.displayAs == null || suggestion.displayAs == '') {
      suggestionText = '\xa0';  // default:  nbsp.
    } else {
      // Default the LTR ordering to match that of the active keyboard.
      let orderCode = rtl ? 0x202e /* RTL */ : 0x202d /* LTR */;
      suggestionText = String.fromCharCode(orderCode) + suggestion.displayAs;
    }

    // TODO:  Dynamic suggestion text resizing.  (Refer to OSKKey.getTextWidth in visualKeyboard.ts.)

    // Finalize the suggestion text
    s.innerHTML = suggestionText;
    return s;
  }
}

/**
 * Function     SuggestionBanner
 * Scope        Public
 * @param {number} height - If provided, the height of the banner in pixels
 * Description  Display lexical model suggestions in the banner
 */
export class SuggestionBanner extends Banner {
  public static readonly SUGGESTION_LIMIT: number = 3;
  public static readonly MARGIN = 1;

  public readonly events: EventEmitter<SuggestionInputEventMap>;

  private currentSuggestions: Suggestion[] = [];

  private options : BannerSuggestion[] = [];
  private hostDevice: DeviceSpec;

  private gestureEngine: GestureRecognizer<BannerSuggestion>;

  private _predictionContext: PredictionContext;

  static readonly TOUCHED_CLASS: string = 'kmw-suggest-touched';
  static readonly BANNER_CLASS: string = 'kmw-suggest-banner';

  constructor(hostDevice: DeviceSpec, height?: number) {
    super(height || Banner.DEFAULT_HEIGHT);
    this.hostDevice = hostDevice;

    this.getDiv().className = this.getDiv().className + ' ' + SuggestionBanner.BANNER_CLASS;
    this.buildInternals(false);

    this.events = new EventEmitter<SuggestionInputEventMap>(); //this.manager.events;

    this.gestureEngine = this.setupInputHandling();
  }

  buildInternals(rtl: boolean) {
    if(this.options.length > 0) {
      this.options.splice(0, this.options.length); // Clear the array.
    }
    for (var i=0; i<SuggestionBanner.SUGGESTION_LIMIT; i++) {
      let d = new BannerSuggestion(i, rtl);
      this.options[i] = d;
    }

    /* LTR behavior:  the default (index 0) suggestion should be at the left
      * RTL behavior:  the default (index 0) suggestion should be at the right
      *
      * The cleanest way to make it work - simply invert the order in which
      * the elements are inserted for RTL.  This allows the banner to be RTL
      * for visuals/UI while still being internally LTR.
      */
    for (var i=0; i<SuggestionBanner.SUGGESTION_LIMIT; i++) {
      let indexToInsert = rtl ? SuggestionBanner.SUGGESTION_LIMIT - i -1 : i;
      this.getDiv().appendChild(this.options[indexToInsert].div);

      if(i != SuggestionBanner.SUGGESTION_LIMIT) {
        // Adds a 'separator' div element for UI purposes.
        let separatorDiv = createUnselectableElement('div');
        separatorDiv.className = 'kmw-banner-separator';

        let ds = separatorDiv.style;
        ds.marginLeft = (SuggestionBanner.MARGIN / 2) + '%';
        ds.marginRight = (SuggestionBanner.MARGIN / 2) + '%';

        this.getDiv().appendChild(separatorDiv);
      }
    }
  }

  private setupInputHandling(): GestureRecognizer<BannerSuggestion> {

    const findTargetFrom = (e: HTMLElement): HTMLDivElement => {
    try {
      if(e) {
        if(e.classList.contains('kmw-suggest-option')) {
          return e as HTMLDivElement;
        }
        if(e.parentElement && e.parentElement.classList.contains('kmw-suggest-option')) {
          return e.parentElement as HTMLDivElement;
        }
      }
    } catch(ex) {}
      return null;
    }

    const config: GestureRecognizerConfiguration<BannerSuggestion> = {
      targetRoot: this.getDiv(),
      maxRoamingBounds: new PaddedZoneSource(this.getDiv(), [-0.333 * this.height]),
      // touchEventRoot:  this.element, // is the default
      itemIdentifier: (sample, target: HTMLElement) => {
        let bestMatch: BannerSuggestion = null;
        let bestDist = Number.MAX_VALUE;

        for(const option of this.options) {
          const optionBounding = option.div.getBoundingClientRect();

          if(optionBounding.left <= sample.clientX && sample.clientX < optionBounding.right) {
            return option;
          } else {
            const dist = (sample.clientX < optionBounding.left ? -1 : 1) * (sample.clientX - optionBounding.left);

            if(dist < bestDist) {
              bestDist = dist;
              bestMatch = option;
            }
          }
        }

        return bestMatch;
      }
    };

    const engine = new GestureRecognizer<BannerSuggestion>(BANNER_GESTURE_SET, config);

    const sourceTracker: {
      source: GestureSource<BannerSuggestion>,
      roamingHighlightHandler: (sample: InputSample<BannerSuggestion>) => void,
      suggestion: BannerSuggestion
    } = {
      source: null,
      roamingHighlightHandler: null,
      suggestion: null
    };

    engine.on('inputstart', (source) => {
      // The banner does not support multi-touch - if one is still current, block all others.
      if(sourceTracker.source) {
        source.terminate(true);
        return;
      }

      sourceTracker.source = source;
      sourceTracker.roamingHighlightHandler = (sample) => {
          // Maintain highlighting
          const suggestion = sample.item;

          if(suggestion != sourceTracker.suggestion) {
            sourceTracker.suggestion.highlight(false);
            suggestion.highlight(true);
            sourceTracker.suggestion = suggestion;
          }
        };
      sourceTracker.suggestion = source.currentSample.item;


      source.currentSample.item.highlight(true);

      const terminationHandler = () => {
        sourceTracker.suggestion.highlight(false);
        sourceTracker.source = null;
        sourceTracker.roamingHighlightHandler = null;
        sourceTracker.suggestion = null;
      }

      source.path.on('complete', terminationHandler);
      source.path.on('invalidated', terminationHandler);
      source.path.on('step', sourceTracker.roamingHighlightHandler);
    });

    engine.on('recognizedgesture', (sequence) => {
      // The actual result comes in via the sequence's `stage` event.
      sequence.once('stage', (result) => {
        const suggestion = result.item; // Should also == sourceTracker.suggestion.
        if(suggestion) {
          this.predictionContext.accept(suggestion.suggestion);
        }
      });
    });

    return engine;
  }

  protected update() {
    const result = super.update();

    // Ensure the banner's extended recognition zone is based on proper, up-to-date layout info.
    // Note:  during banner init, `this.gestureEngine` may only be defined after
    // the first call to this setter!
    (this.gestureEngine?.config.maxRoamingBounds as PaddedZoneSource)?.updatePadding([-0.333 * this.height]);

    return result;
  }

  public configureForKeyboard(keyboard: Keyboard, keyboardProperties: KeyboardProperties) {
    const rtl = keyboard.isRTL;

    // Removes all previous children.  (.replaceChildren requires Chrome for Android 86.)
    // Instantly replaces all children with an empty text node, bypassing the need to actually
    // parse incoming HTML.
    //
    // Just in case, alternative approaches: https://stackoverflow.com/a/3955238
    this.getDiv().textContent = '';

    // Builds new children to match needed RTL properties.
    this.buildInternals(rtl);

    this.options.forEach((option) => option.matchKeyboardProperties(keyboardProperties));
    this.onSuggestionUpdate(this.currentSuggestions); // restore suggestions
  }

  public get predictionContext(): PredictionContext {
    return this._predictionContext;
  }

  public set predictionContext(context: PredictionContext) {
    if(this._predictionContext) {
      // disconnect the old one!
      this._predictionContext.off('update', this.onSuggestionUpdate);
    }

    // connect the new one!
    this._predictionContext = context;
    if(context) {
      context.on('update', this.onSuggestionUpdate);
      this.onSuggestionUpdate(context.currentSuggestions);
    }
  }

  public onSuggestionUpdate = (suggestions: Suggestion[]): void => {
    this.currentSuggestions = suggestions;

    this.options.forEach((option: BannerSuggestion, i: number) => {
      if(i < suggestions.length) {
        option.update(suggestions[i]);
      } else {
        option.update(null);
      }
    });
  }
}

interface SuggestionInputEventMap {
  highlight: (bannerSuggestion: BannerSuggestion, state: boolean) => void,
  apply: (bannerSuggestion: BannerSuggestion) => void;
  hold: (bannerSuggestion: BannerSuggestion) => void;
}