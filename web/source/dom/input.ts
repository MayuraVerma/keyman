/// <reference path="../text/outputTarget.ts" />

namespace com.keyman.dom {

  export class Input extends text.OutputTarget {
    root: HTMLInputElement;

    /**
     * Tracks the most recently-cached selection start index.
     */
    private _cachedSelectionStart: number

    /**
     * Tracks the most recently processed, extended-string-based selection start index.
     * When the element's selectionStart value changes, this should be invalidated.
     */
    private processedSelectionStart: number;

    /**
     * Tracks the most recently processed, extended-string-based selection end index.
     * When the element's selectionEnd value changes, this should be invalidated.
     */
    private processedSelectionEnd: number;

    constructor(ele: HTMLInputElement) {
      super();

      this.root = ele;
      this._cachedSelectionStart = -1;
    }

    getElement(): HTMLInputElement {
      return this.root;
    }

    clearSelection(): void {
      // Processes our codepoint-based variants of selectionStart and selectionEnd.
      let caret = this.getCaret();
      this.root.value = this.root.value._kmwSubstring(0, caret) + this.root.value._kmwSubstring(this.processedSelectionEnd); //I3319

      this.setCaret(caret);
    }

    hasSelection(): boolean {
      return true;
    }

    invalidateSelection() {
      // Since .selectionStart will never return this value, we use it to indicate
      // the need to refresh our processed indices.
      this._cachedSelectionStart = -1;
    }

    getCaret(): number {
      if(this.root.selectionStart == this._cachedSelectionStart) {
        return this.processedSelectionStart;
      } else {
        this._cachedSelectionStart = this.root.selectionStart; // KMW-1
        this.processedSelectionStart = this.root.value._kmwCodeUnitToCodePoint(this.root.selectionStart); // I3319
        this.processedSelectionEnd = this.root.value._kmwCodeUnitToCodePoint(this.root.selectionEnd);     // I3319

        return this.processedSelectionStart;
      }
    }

    getDeadkeyCaret(): number {
      return this.getCaret();
    }

    setCaret(caret: number) {
      this.setSelection(caret, caret);
    }

    setSelection(start: number, end: number) {
      let domStart = this.root.value._kmwCodePointToCodeUnit(start);
      let domEnd = this.root.value._kmwCodePointToCodeUnit(end);
      this.root.setSelectionRange(domStart, domEnd);

      this.processedSelectionStart = start;
      this.processedSelectionEnd = end;
    }

    getTextBeforeCaret(): string {
      return this.getText()._kmwSubstring(0, this.getCaret());
    }

    setTextBeforeCaret(text: string) {
      this.getCaret();
      let newCaret = text._kmwLength();
      this.root.value = text + this.getText()._kmwSubstring(this.processedSelectionStart);

      this.setCaret(newCaret);
    }

    protected setTextAfterCaret(s: string) {
      let c = this.getCaret();

      this.root.value = this.getTextBeforeCaret() + s;
      this.setCaret(c);
    }

    getTextAfterCaret(): string {
      this.getCaret();
      return this.getText()._kmwSubstring(this.processedSelectionEnd);
    }

    getText(): string {
      return this.root.value;
    }

    deleteCharsBeforeCaret(dn: number) {
      if(dn > 0) {
        let curText = this.getTextBeforeCaret();
        let caret = this.getCaret();

        this.adjustDeadkeys(-dn);
        this.setTextBeforeCaret(curText.kmwSubstring(0, this.getCaret() - dn));
        this.setCaret(caret - dn);
      }
    }

    insertTextBeforeCaret(s: string) {
      if(!s) {
        return;
      }

      let caret = this.getCaret();
      let front = this.getTextBeforeCaret();
      let back = this.getText()._kmwSubstring(this.processedSelectionStart);

      this.adjustDeadkeys(s._kmwLength());
      this.root.value = front + s + back;
      this.setCaret(caret + s._kmwLength());
    }
  }
}