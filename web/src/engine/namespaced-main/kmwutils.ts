// Includes KMW-added property declaration extensions for HTML elements.
/// <reference path="kmwexthtml.ts" />
// Includes the DOM utils, since our UI modules need access to certain methods here.
/// <reference path="dom/utils.ts" />

namespace com.keyman {
  export class Util {
    // Generalized component event registration
    device: Device;
    activeDevice: Device;
    physicalDevice: Device;

    waiting: HTMLDivElement;                  // The element displayed for util.wait and util.alert.

    private embeddedFonts: any[] = [];     // Array of currently embedded font descriptor entries.  (Is it just a string?)

    // Consider refactoring keymanweb.options to within Util.

    private keyman: KeymanBase; // Closure doesn't like relying on the global object from within a class def.

    constructor(keyman: any) {
      this.initDevices();

      this.keyman = keyman;
    }

    // Possible alternative:  https://www.npmjs.com/package/language-tags
    // This would necessitate linking in a npm module into compiled KeymanWeb, though.
    ['getLanguageCodes'](lgCode: string): string[] {
      if(lgCode.indexOf('-')==-1) {
        return [lgCode];
      } else {
        return lgCode.split('-');
      }
    }

    initDevices(): void {
      this.device = new Device();
      this.physicalDevice = new Device();
      this.activeDevice = this.device;

      // Initialize the true device values.
      this.device.detect();

      /* DEBUG: Force touch device   (Build 360)

      device.touchable = true;
      device.browser = 'safari';
      device.formFactor = 'tablet';
      device.OS = 'iOS';

      END DEBUG */

      /* If we've made it to this point of initialization and aren't anything else, KeymanWeb assumes
      * we're a desktop.  Since we don't yet support desktops with touch-based input, we disable it here.
      */
      if(this.device.formFactor == 'desktop') {
        this.device.touchable = false;
      }

      /**
       * Represents hardware-based keystrokes regardless of the 'true' device, facilitating hardware keyboard input
       * whenever touch-based input is available.
       */
      this.physicalDevice = new Device();
      this.physicalDevice.touchable = false;
      this.physicalDevice.browser = this.device.browser;
      this.physicalDevice.formFactor = 'desktop';
      this.physicalDevice.OS = this.device.OS;
    }

    // -----------------------------------------------

    /**
     * Function     getOption
     * Scope        Public
     * @param       {string}    optionName  Name of option
     * @param       {*=}        dflt        Default value of option
     * @return      {*}
     * Description  Returns value of named option
     */
    getOption(optionName:string, dflt:any): any {
      if(optionName in this.keyman.options) {
        return this.keyman.options[optionName];
      } else if(arguments.length > 1) {
        return dflt;
      } else {
        return '';
      }
    }

    /**
     * More reliable way of identifying  element class
     * @param   {Object}  e HTML element
     * @param   {string}  name  class name
     * @return  {boolean}
     */
    hasClass(e: HTMLElement, name: string): boolean {
      var className = " " + name + " ";
      return (" " + e.className + " ").replace(/[\n\t\r\f]/g, " ").indexOf(className) >= 0;
    }

    /**
     * Function     setOption
     * Scope        Public
     * @param       {string}    optionName  Name of option
     * @param       {*=}        value       Value of option
     * Description  Sets value of named option
     */
    setOption(optionName,value) {
      this.keyman.options[optionName] = value;
    }
    /**
     * Select start handler (to replace multiple inline handlers) (Build 360)
     */
    selectStartHandler = function() {
      return false;
    }

        /**
     * Function     _CancelMouse
     * Scope        Private
     * @param       {Object}      e     event
     * @return      {boolean}           always false
     * Description  Closes mouse click event
     */
    _CancelMouse=function(e: MouseEvent) {
      if(e && e.preventDefault) {
        e.preventDefault();
      }
      if(e) {
        e.cancelBubble=true;
      } // I2409 - Avoid focus loss for visual keyboard events

      return false;
    }

    /**
     * Get browser-independent computed style integer value for element  (Build 349)
     *
     * @param       {Element}     e             HTML element
     * @param       {string}      s             CSS style name
     * @param       {number=}     d             default value if NaN
     * @return      {number}                    integer value of style
     */
    getStyleInt(e: HTMLElement, s: string, d?: number): number {
      var x=parseInt(this.getStyleValue(e,s),10);
      if(!isNaN(x)) {
        return x;
      }

      // Return the default value if numeric, else 0
      if(typeof(d) == 'number') {
        return d;
      } else {
        return 0;
      }
    }

    /**
     * Expose the touchable state for UIs - will disable external UIs entirely
     **/
    isTouchDevice(): boolean {
      return this.device.touchable;
    }

    /**
     * Get orientation of tablet or phone  display
     *
     * @return      {boolean}
     */
    portraitView() { // new for I3363 (Build 301)
      return !this.landscapeView();
    }

    /**
     * Get orientation of tablet or phone  display
     *
     * @return      {boolean}
     */
    landscapeView(): boolean	{ // new for I3363 (Build 301)
      var orientation: number;

      // Assume portrait mode if orientation undefined
      if(typeof window.orientation != 'undefined') { // Used by iOS Safari
        // Else landscape for +/-90, portrait for 0, +/-180
        orientation = window.orientation as number;
      } else if(typeof window.screen.orientation != 'undefined') { // Used by Firefox, Chrome
        orientation = window.screen.orientation.angle;
      }

      if(orientation !== undefined) {
        return (Math.abs(orientation/90) == 1);
      } else {
        return false;
      }
    }

    /**
     * Return height of URL bar on mobile devices, if visible
     * TODO: This does not seem to be right, so is not currently used
     *
     * @return      {number}
     */
    barHeight(): number {
      var dy=0;
      if(this.device.formFactor == 'phone') {
        dy=screen.height/2-window.innerHeight-(this.landscapeView() ? this.device.dyLandscape: this.device.dyPortrait);
      }
      return dy;
    }

    /**
     * Function     _EncodeEntities
     * Scope        Private
     * @param       {string}      P_txt         string to be encoded
     * @return      {string}                    encoded (html-safe) string
     * Description Encode angle brackets and ampersand in text string
     */
    _EncodeEntities(P_txt: string): string {
      return P_txt.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;');  // I1452 part 2
    }

    /**
     * Function     createShim
     * Scope        Public
     * Description  [Deprecated] Create an IFRAME element to go between KMW and drop down (to fix IE6 bug)
     * @deprecated
     */
    createShim(): void {    // I1476 - Handle SELECT overlapping BEGIN
      console.warn("The util.createShim function is deprecated, as its old functionality is no longer needed.  " +
        "It and references to its previously-produced shims may be safely removed.");
      return;
    }

    // I1476 - Handle SELECT overlapping BEGIN

    /**
     * Function     showShim
     * Scope        Public
     * @param       {Object}      Pvkbd         Visual keyboard DIV element
     * @param       {Object}      Pframe        IFRAME shim element
     * @param       {Object}      Phelp         OSK Help DIV element
     * Description  [Deprecated] Display iFrame under OSK at its currently defined position, to allow OSK to overlap SELECT elements (IE6 fix)
     * @deprecated
     */
    showShim(Pvkbd: HTMLElement, Pframe: HTMLElement, Phelp: HTMLElement) {
      console.warn("The util.showShim function is deprecated, as its old functionality is no longer needed.  It may be safely removed.");
    }

    /**
     * Function     hideShim
     * Scope        Public
     * @param       {Object}      Pframe        IFRAME shim element
     * Description  [Deprecated] Hide iFrame shim containing OSK
     * @deprecated
     */
    hideShim(Pframe: HTMLElement) {
      console.warn("The util.hideShim function is deprecated, as its old functionality is no longer needed.  It may be safely removed.");
    }

    /**
     * Function     rgba
     * Scope        Public
     * @param       {Object}      s           element style object
     * @param       {number}      r           red value, 0-255
     * @param       {number}      g           green value, 0-255
     * @param       {number}      b           blue value, 0-255
     * @param       {number}      a           opacity value, 0-1.0
     * @return      {string}                  background colour style string
     * Description  Browser-independent alpha-channel management
     */
    rgba(s: HTMLStyleElement, r:number, g:number, b:number, a:number): string {
      var bgColor='transparent';
      try {
        bgColor='rgba('+r+','+g+','+b+','+a+')';
      } catch(ex) {
        bgColor='rgb('+r+','+g+','+b+')';
      }

      return bgColor;
    }

    /**
     * Function     toNumber
     * Scope        Public
     * @param       {string}      s            numeric string
     * @param       {number}      dflt         default value
     * @return      {number}
     * Description  Return string converted to integer or default value
     */
    toNumber(s: string, dflt: number): number {
      var x = parseInt(s,10);
      return isNaN(x) ? dflt : x;
    }

    /**
     * Function     toNumber
     * Scope        Public
     * @param       {string}      s            numeric string
     * @param       {number}      dflt         default value
     * @return      {number}
     * Description  Return string converted to real value or default value
     */
    toFloat(s: string, dflt: number): number {
      var x = parseFloat(s);
      return isNaN(x) ? dflt : x;
    }

    /**
     * Function     toNzString
     * Scope        Public
     * @param       {*}           item         variable to test
     * @param       {?*=}         dflt         default value
     * @return      {*}
     * Description  Test if a variable is null, false, empty string, or undefined, and return as string
     */
    nzString(item: any, dflt: any): string {
      var dfltValue = '';
      if(arguments.length > 1) {
        dfltValue = dflt;
      }

      if(typeof(item) == 'undefined') {
        return dfltValue;
      }

      if(item == null) {
        return dfltValue;
      }

      if(item == 0 || item == '') {
        return dfltValue;
      }

      return ''+item;
    }

    /**
     * Return the event target for any browser
     *
     * @param       {Event}      e        event
     * @return      {Object}              HTML element
     */
    eventTarget(e: Event): EventTarget {
      if(!e) {
        return null;
      } else if (e.target) {       // most browsers
        return e.target;
      } else if (e.srcElement) {
        return e.srcElement;
      } else {
        return null;            // shouldn't happen!
      }
    }

    /**
     * Return the event type for any browser
     *
     * @param       {Event}      e        event
     * @return      {string}              type of event
     */
    eventType(e: Event): string {
      if(e && e.type) {         // most browsers
        return e.type;
      } else {
        return '';              // shouldn't happen!
      }
    }

    /**
     * Customized alert.
     *
     * @param     {string}        s       alert text
     * @param     {function()=}   fn      function to call when alert dismissed
     */
    alert(s: string, fn?: () => void): void {
      var bg = this.waiting, nn=bg.firstChild.childNodes;
      (nn[0] as HTMLElement).style.display='block';
      (nn[1] as HTMLElement).className='kmw-alert-text';
      (nn[1] as HTMLElement).innerHTML=s;
      (nn[2] as HTMLElement).style.display='none';
      bg.style.display='block';
      bg.dismiss = arguments.length > 1 ? fn : null;
    }

    // Stub definition to be fleshed out depending upon native/embedded mode.
    wait(s: string|boolean): void {

    }

    /**
     * Customized internal alert. This is enabled/disabled by the option flag 'useAlerts'
     *
     * @param     {string}        s       alert text
     * @param     {function()=}   fn      function to call when alert dismissed
     */
     internalAlert(s: string, fn?: () => void): void {
       if (this.keyman.options.useAlerts) {
         this.alert(s, fn);
       }
     }

    /**
     *  Prepare the background and keyboard loading wait message box
     *  Should not be called before options are defined during initialization
     **/
    prepareWait(): void {
      var bg: HTMLDivElement = <HTMLDivElement>document.createElement('DIV'),
          lb=document.createElement('DIV'),
          lt=document.createElement('DIV'),
          gr=document.createElement('DIV'),
          bx=document.createElement('DIV');

      bg.className='kmw-wait-background';
      lb.className='kmw-wait-box';
      bg.dismiss=null;
      lt.className='kmw-wait-text';
      gr.className='kmw-wait-graphic';
      bx.className='kmw-alert-close';

      // Close alert if anywhere in box is touched, since close box is too small on mobiles
      lb.onmousedown=lb.onclick=function(e) {
        // Ignore if waiting, only handle for alert
        if(bx.style.display == 'block') {
          bg.style.display='none';
          if(bg.dismiss) {
            bg.dismiss();
          }
        }
      };

      lb.addEventListener('touchstart', lb.onclick, false);
      bg.onmousedown=bg.onclick=function(e) {
        e.preventDefault();
        e.stopPropagation();

      }
      bg.addEventListener('touchstart', bg.onclick, false);
      lb.appendChild(bx);
      lb.appendChild(lt);
      lb.appendChild(gr);
      bg.appendChild(lb);
      document.body.appendChild(bg);
      this.waiting=bg;
    }

    shutdown() {
      // Remove all event-handler references rooted in KMW events.
      this.events = {};

      // Remove all events linking to elements of the original, unaltered page.
      // This should sever any still-existing page ties to this instance of KMW,
      // allowing browser GC to do its thing.
      for(let event of this.domEvents) {
        this.detachDOMEvent(event.Pelem, event.Peventname, event.Phandler, event.PuseCapture);
      }

      // alt / modularized form for the above:  given `eventTracker: DomEventTracker`, call
      // `eventTracker.shutdown()`.

      // Remove any KMW-added DOM element clutter.
      this.waiting.parentNode.removeChild(this.waiting);
    }

    /**
     * Get path of keymanweb script, for relative references
     *
     * *** This is not currently used, but may possibly be needed if ***
     * *** script identification during loading proves unreliable.   ***
     *
     *  @param    {string}      sName   filename prefix
     *  @return   {string}      path to source, with trailing slash
    **/
    myPath(sName: string): string {
      var i, scripts=document.getElementsByTagName('script'), ss;

      for(i=0; i<scripts.length; i++) {
        ss=scripts[i];
        if(ss.src.indexOf(sName) >= 0) {
          return ss.src.substr(0,ss.src.lastIndexOf('/')+1);
        }
      }

      return '';
    }

    // Prepend the appropriate protocol if not included in path
    prependProtocol(path: string): string {
      var pattern = new RegExp('^https?:');

      if(pattern.test(path)) {
        return path;
      } else if(path.substr(0,2) == '//') {
        return this.keyman.protocol+path;
      } else if(path.substr(0,1) == '/') {
        return this.keyman.protocol+'/'+path;
      } else {
        return this.keyman.protocol+'//'+path;
      }
    }
  }
}

import Util = com.keyman.Util;
