import { GlobalSections, Section } from "../kmx/kmx-plus";
import LDMLKeyboardXMLSourceFile, { LKKeyboard } from "../ldml-keyboard/ldml-keyboard-xml";
import CompilerCallbacks from "./callbacks";
import { SectionIdent } from '@keymanapp/ldml-keyboard-constants';

/* istanbul ignore next */
export class SectionCompiler {
  protected readonly keyboard: LKKeyboard;
  protected readonly callbacks: CompilerCallbacks;

  constructor(source: LDMLKeyboardXMLSourceFile, callbacks: CompilerCallbacks) {
    this.keyboard = source.keyboard;
    this.callbacks = callbacks;
  }

  public get id(): SectionIdent {
    return null;
  }

  public get required(): boolean {
    return true;
  }

  public compile(sections: GlobalSections): Section {
    return null;
  }

  public validate(): boolean {
    return true;
  }
}