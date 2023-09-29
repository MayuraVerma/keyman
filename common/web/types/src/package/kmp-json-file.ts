export interface KmpJsonFile {
  system: KmpJsonFileSystem;
  options: KmpJsonFileOptions;
  info?: KmpJsonFileInfo;
  files?: KmpJsonFileContentFile[];
  lexicalModels?: KmpJsonFileLexicalModel[];
  startMenu?: KmpJsonFileStartMenu;
  keyboards?: KmpJsonFileKeyboard[];
  relatedPackages?: KmpJsonRelatedPackage[];
}

export interface KmpJsonFileSystem {
  keymanDeveloperVersion: string;
  fileVersion: string;
}

export interface KmpJsonFileOptions {
  readmeFile?: string;
  graphicFile?: string;
  licenseFile?: string;
  executeProgram?: string;
  msiFilename?: string;
  msiOptions?: string;
}

export interface KmpJsonFileInfo {
  website?: KmpJsonFileInfoItem;
  version?: KmpJsonFileInfoItem;
  name?: KmpJsonFileInfoItem;
  copyright?: KmpJsonFileInfoItem;
  author?: KmpJsonFileInfoItem;
  /**
   * A Markdown description of the keyboard, intended for use in websites
   * referencing the keyboard
   */
  description?: KmpJsonFileInfoItem;
}

export interface KmpJsonFileInfoItem {
  description: string;
  url?: string;
}

export interface KmpJsonFileContentFile {
  name: string;
  description: string;
  copyLocation?: number;
}

export interface KmpJsonFileLexicalModel {
  name: string;
  id: string;
  languages: KmpJsonFileLanguage[];
}

export interface KmpJsonFileLanguage {
  name: string;
  id: string;
}

export interface KmpJsonFileKeyboard {
  name: string;
  id: string;
  version: string;
  oskFont?: string;
  displayFont?: string;
  rtl?: boolean;
  languages?: KmpJsonFileLanguage[];
  examples?: KmpJsonFileExample[];
  /**
   * array of web font alternatives for OSK. should be same font data as oskFont
   */
  webOskFonts?: string[];
  /**
   * array of web font alternatives for display. should be same font data as displayFont
   */
  webDisplayFonts?: string[];
}

export interface KmpJsonFileStartMenu {
  folder?: string;
  addUninstallEntry?: boolean;
  items?: KmpJsonFileStartMenuItem[];
}

export interface KmpJsonFileStartMenuItem {
  name: string;
  filename: string;
  arguments?: string;
  icon?: string;
  location?: string;
}

export interface KmpJsonFileExample {
  /**
   * BCP 47 identifier for the example
   */
  id: string;
  /**
   * A space-separated list of keys, modifiers indicated with "+", spacebar is "space", plus key is "shift+=" or "plus"
   */
  keys: string;
  /**
   * The text that would be generated by typing those keys
   */
  text?: string;
  /**
   * A short description of what the text means or represents
   */
  note?: string;
}

export interface KmpJsonRelatedPackage {
  id: string;
  relationship: "deprecates" | "related";
}
