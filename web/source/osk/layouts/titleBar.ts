/// <reference path="mouseDragOperation.ts" />

namespace com.keyman.osk.layouts {
  export class TitleBar {
    private _element: HTMLDivElement;
    private _unpinButton: HTMLDivElement;
    private _closeButton: HTMLDivElement;
    private _helpButton: HTMLDivElement;
    private _configButton: HTMLDivElement;
    private _caption: HTMLSpanElement;

    public constructor(dragHandler?: MouseDragOperation) {
      this._element = this.buildTitleBar();
      this.attachHandlers();

      if(dragHandler) {
        this.element.onmousedown = dragHandler.mouseDownHandler;
      }
    }

    private mouseCancellingHandler: (ev: MouseEvent) => boolean = function(ev: MouseEvent) {
      ev.preventDefault();
      ev.cancelBubble = true;
      return false;
    };

    public get element(): HTMLDivElement {
      return this._element;
    }

    public setPinCJKOffset() {
      this._unpinButton.style.left = '15px';
    }

    public showPin(visible: boolean) {
      this._unpinButton.style.display = visible ? 'block' : 'none';
    }

    public setTitle(str: string) {
      this._caption.innerHTML = str;
    }

    public setTitleFromKeyboard(keyboard: keyboards.Keyboard) {
      let title = "<span style='font-weight:bold'>" + keyboard.name + '</span>';  // I1972  // I2186
      this._caption.innerHTML = title;
    }

    public attachHandlers() {
      let osk = com.keyman.singleton.osk;
      let util = com.keyman.singleton.util;

      this._helpButton.onclick = function() {
        var p={};
        util.callEvent('osk.helpclick',p);
        if(window.event) {
          window.event.returnValue=false;
        }
        return false;
      }

      this._configButton.onclick = function() {
        var p={};
        util.callEvent('osk.configclick',p);
        if(window.event) {
          window.event.returnValue=false;
        }
        return false;
      }

      this._closeButton.onclick = function () {
        osk._Hide(true);
        return false;
      };

      this._unpinButton.onclick = function () {
        osk.restorePosition(true);
        return false;
      }
    }

    /**
     * Create a control bar with title and buttons for the desktop OSK
     */
    buildTitleBar(): HTMLDivElement {
      let bar = document.createElement('div');
      this.markUnselectable(bar);
      bar.id='keymanweb_title_bar';
      bar.className='kmw-title-bar';

      var Ltitle = this._caption = document.createElement('span');
      this.markUnselectable(Ltitle);
      Ltitle.className='kmw-title-bar-caption';
      Ltitle.style.color='#fff';
      bar.appendChild(Ltitle);

      var Limg = this._closeButton = this.buildCloseButton();
      bar.appendChild(Limg);

      Limg = this._helpButton = this.buildHelpButton()
      bar.appendChild(Limg);

      Limg = this._configButton = this.buildConfigButton();
      bar.appendChild(Limg);

      Limg = this._unpinButton = this.buildUnpinButton();
      bar.appendChild(Limg);

      return bar;
    }

    private markUnselectable(e: HTMLElement) {
      e.style.MozUserSelect="none";
      e.style.KhtmlUserSelect="none";
      e.style.UserSelect="none";
      e.style.WebkitUserSelect="none";
    }

    private buildCloseButton(): HTMLDivElement {
      var Limg = document.createElement('div');
      this.markUnselectable(Limg);

      Limg.id='kmw-close-button';
      Limg.className='kmw-title-bar-image';
      Limg.onmousedown = this.mouseCancellingHandler;

      return Limg;
    }

    private buildHelpButton(): HTMLDivElement {
      let Limg = document.createElement('div');
      this.markUnselectable(Limg);
      Limg.id='kmw-help-image';
      Limg.className='kmw-title-bar-image';
      Limg.title='KeymanWeb Help';
      Limg.onmousedown = this.mouseCancellingHandler;
      return Limg;
    }

    private buildConfigButton(): HTMLDivElement {
      let Limg = document.createElement('div');
      this.markUnselectable(Limg);

      Limg.id='kmw-config-image';
      Limg.className='kmw-title-bar-image';
      Limg.title='KeymanWeb Configuration Options';
      Limg.onmousedown = this.mouseCancellingHandler;

      return Limg;
    }

    /**
     * Builds an 'unpin' button for restoring OSK to default location, handle mousedown and click events
     */
    private buildUnpinButton(): HTMLDivElement {
      let Limg = document.createElement('div');  //I2186
      this.markUnselectable(Limg);

      Limg.id = 'kmw-pin-image'; 
      Limg.className = 'kmw-title-bar-image';
      Limg.title='Pin the On Screen Keyboard to its default location on the active text box';

      Limg.onmousedown = this.mouseCancellingHandler;

      return Limg;
    }
  }
}