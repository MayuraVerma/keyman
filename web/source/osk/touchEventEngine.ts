/// <reference path="inputEventEngine.ts" />

namespace com.keyman.osk {
  export class TouchEventEngine extends InputEventEngine {
    private readonly _touchStart: typeof TouchEventEngine.prototype.onTouchStart;
    private readonly _touchMove:  typeof TouchEventEngine.prototype.onTouchMove;
    private readonly _touchEnd:   typeof TouchEventEngine.prototype.onTouchEnd;

    private vkbd: VisualKeyboard;

    public constructor(
      controller: any,
      eventRoot: HTMLElement,
      inputStartHandler:      InputHandler,
      inputMoveHandler:       InputHandler,
      inputMoveCancelHandler: InputHandler,
      inputEndHandler:        InputHandler
    ) {
      super(
        eventRoot,
        inputStartHandler,
        inputMoveHandler,
        inputMoveCancelHandler,
        inputEndHandler
      );

      if(controller instanceof VisualKeyboard) {
        this.vkbd = controller;
      }

      this._touchStart = this.onTouchStart.bind(this);
      this._touchMove  = this.onTouchMove.bind(this);
      this._touchEnd   = this.onTouchEnd.bind(this);
    }

    public static forVisualKeyboard(vkbd: VisualKeyboard) {
      return new TouchEventEngine(
        vkbd,
        vkbd.element,
        vkbd.touch.bind(vkbd),
        vkbd.moveOver.bind(vkbd),
        vkbd.moveCancel.bind(vkbd),
        vkbd.release.bind(vkbd)
      );
    }

    registerEventHandlers() {
      this.eventRoot.addEventListener('touchstart', this._touchStart, true);
      this.eventRoot.addEventListener('touchmove',  this._touchMove, false);
      // The listener below fails to capture when performing automated testing checks in Chrome emulation unless 'true'.
      this.eventRoot.addEventListener('touchend',   this._touchEnd, true);
    }

    unregisterEventHandlers() {
      this.eventRoot.removeEventListener('touchstart', this._touchStart, true);
      this.eventRoot.removeEventListener('touchmove',  this._touchMove, false);
      this.eventRoot.removeEventListener('touchend',   this._touchEnd, true);
    }

    private preventPropagation(e: TouchEvent) {
      // Standard event maintenance
      e.preventDefault();
      e.cancelBubble=true;

      if(typeof e.stopImmediatePropagation == 'function') {
        e.stopImmediatePropagation();
      } else if(typeof e.stopPropagation == 'function') {
        e.stopPropagation();
      }
    }

    onTouchStart(event: TouchEvent) {
      this.onInputStart(InputEventCoordinate.fromEvent(event));
    }

    onTouchMove(event: TouchEvent) {
      this.preventPropagation(event);
      const coord = InputEventCoordinate.fromEvent(event);

      if(this.vkbd.detectWithinInteractiveBounds(coord)) {
        this.onInputMove(coord);
      } else {
        this.onInputMoveCancel(coord);
      }
    }

    onTouchEnd(event: TouchEvent) {
      this.onInputEnd(InputEventCoordinate.fromEvent(event));
    }
  }
}