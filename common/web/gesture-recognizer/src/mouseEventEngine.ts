/// <reference path="inputEventEngine.ts" />
/// <reference path="gestureRecognizerConfiguration.ts" />

namespace com.keyman.osk {
  export class MouseEventEngine extends InputEventEngine {
    private readonly _mouseStart: typeof MouseEventEngine.prototype.onMouseStart;
    private readonly _mouseMove:  typeof MouseEventEngine.prototype.onMouseMove;
    private readonly _mouseEnd:   typeof MouseEventEngine.prototype.onMouseEnd;

    private hasActiveClick: boolean = false;
    private disabledSafeBounds: number = 0;

    private IDENTIFIER_SEED: number;

    public constructor(config: Nonoptional<GestureRecognizerConfiguration>) {
      super(config);

      // We use this approach, rather than .bind, because _this_ version allows hook
      // insertion for unit tests via prototype manipulation.  The .bind version doesn't.
      this._mouseStart = (event: MouseEvent) => this.onMouseStart(event);
      this._mouseMove  = (event: MouseEvent) => this.onMouseMove(event);
      this._mouseEnd   = (event: MouseEvent) => this.onMouseEnd(event);

      // IDs should be unique.  Unfortunately, we can't exactly control the identifier values for
      // the `touch` properties of TouchEvents... but they're usually non-negative, so this ought help.
      this.IDENTIFIER_SEED = Math.round(Math.random() * (Number.MIN_SAFE_INTEGER - 10000)) - 10000;
    }

    private get eventRoot(): HTMLElement {
      return this.config.mouseEventRoot;
    }

    private generateIdentifier(): number {
      return this.IDENTIFIER_SEED++;
    }

    private get activeIdentifier(): number {
      return this.IDENTIFIER_SEED-1;
    }

    // public static forVisualKeyboard(vkbd: VisualKeyboard) {
    //   const config: GestureRecognizerConfiguration = {
    //     targetRoot: vkbd.element,
    //     // document.body is the event root b/c we need to track the mouse if it leaves
    //     // the VisualKeyboard's hierarchy.
    //     eventRoot: document.body,
    //   };

    //   return new MouseEventEngine(config);
    // }

    // public static forPredictiveBanner(banner: SuggestionBanner, handlerRoot: SuggestionManager) {
    //   const config: GestureRecognizerConfiguration = {
    //     targetRoot: banner.getDiv(),
    //     // document.body is the event root b/c we need to track the mouse if it leaves
    //     // the VisualKeyboard's hierarchy.
    //     eventRoot: document.body,
    //   };

    //   return new MouseEventEngine(config);
    // }

    registerEventHandlers() {
      this.eventRoot.addEventListener('mousedown', this._mouseStart, true);
      this.eventRoot.addEventListener('mousemove',  this._mouseMove, false);
      // The listener below fails to capture when performing automated testing checks in Chrome emulation unless 'true'.
      this.eventRoot.addEventListener('mouseup',   this._mouseEnd, true);
    }

    unregisterEventHandlers() {
      this.eventRoot.removeEventListener('mousedown', this._mouseStart, true);
      this.eventRoot.removeEventListener('mousemove',  this._mouseMove, false);
      this.eventRoot.removeEventListener('mouseup',   this._mouseEnd, true);
    }

    private preventPropagation(e: MouseEvent) {
      // Standard event maintenance
      e.preventDefault();
      e.cancelBubble=true;
      e.returnValue=false; // I2409 - Avoid focus loss for visual keyboard events

      if(typeof e.stopImmediatePropagation == 'function') {
        e.stopImmediatePropagation();
      } else if(typeof e.stopPropagation == 'function') {
        e.stopPropagation();
      }
    }

    private buildSampleFromEvent(event: MouseEvent): InputSample {
      return this.buildSampleFor(event.clientX, event.clientY);
    }

    onMouseStart(event: MouseEvent) {
      // If it's not an event we'd consider handling, do not prevent event
      // propagation!  Just don't process it.
      if(!this.config.targetRoot.contains(event.target as Node)) {
        return;
      }

      this.preventPropagation(event);

      const sample = this.buildSampleFromEvent(event);

      if(!ZoneBoundaryChecker.inputStartOutOfBoundsCheck(sample, this.config)) {
        // If we started very close to a safe zone border, remember which one(s).
        // This is important for input-sequence cancellation check logic.
        this.disabledSafeBounds = ZoneBoundaryChecker.inputStartSafeBoundProximityCheck(sample, this.config);
      }

      this.onInputStart(this.generateIdentifier(), sample, event.target);
    }

    onMouseMove(event: MouseEvent) {
      if(!this.hasActiveSequence(this.activeIdentifier)) {
        return;
      }

      const sample = this.buildSampleFromEvent(event);

      if(!event.buttons) {
        if(this.hasActiveClick) {
          this.hasActiveClick = false;
          this.onInputMoveCancel(this.activeIdentifier, sample);
        }
        return;
      }

      this.preventPropagation(event);

      if(!ZoneBoundaryChecker.inputMoveCancellationCheck(sample, this.config, this.disabledSafeBounds)) {
        this.onInputMove(this.activeIdentifier, sample);
      } else {
        this.onInputMoveCancel(this.activeIdentifier, sample);
      }
    }

    onMouseEnd(event: MouseEvent) {
      if(!this.hasActiveSequence(this.activeIdentifier)) {
        return;
      }

      if(!event.buttons) {
        this.hasActiveClick = false;
      }

      this.onInputEnd(this.activeIdentifier);
    }
  }
}