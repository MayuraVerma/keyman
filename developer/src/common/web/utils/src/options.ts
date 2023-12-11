import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export interface KeymanDeveloperOptions {
  "use tab char"?: boolean;
  "link font sizes"?: boolean;
  "indent size"?: number;
  "use old debugger"?: boolean;
  "editor theme"?: string;
  "debugger break when exiting line"?: boolean;
  "debugger single step after break"?: boolean;
  "debugger show store offset"?: boolean;
  "debugger recompile with debug info"?: boolean;
  "debugger auto reset before compilng"?: boolean;
  "auto save before compiling"?: boolean;
  "osk auto save before importing"?: boolean;
  "web host port"?: number;
  "server keep alive"?: boolean;
  "server use local addresses"?: boolean;
  "server ngrok token"?: string;
  "server ngrok region"?: string;
  "server use ngrok"?: boolean;
  "server show console window"?: boolean;
  "char map disable database lookups"?: boolean;
  "char map auto lookup"?: boolean;
  "open keyboard files in source view"?: boolean;
  "display theme"?: string;
  "external editor path"?: string;
  "smtp server"?: string;
  "test email addresses"?: string;
  "web ladder length"?: number;
  "default project path"?: string;
  "automatically report errors"?: boolean;
  "automatically report usage"?: boolean;
  "toolbar visible"?: boolean;
  "active project"?: string;
};

type KeymanDeveloperOption = keyof KeymanDeveloperOptions;

// We only load the options from disk once on first use
let options: KeymanDeveloperOptions = null;
let optionsLoaded = false;

function loadOptions(): KeymanDeveloperOptions {
  if(optionsLoaded) {
    return options;
  }

  options = {};
  try {
    const optionsFile = path.join(os.homedir(), '.keymandeveloper', 'options.json');
    if(fs.existsSync(optionsFile)) {
      const data = JSON.parse(fs.readFileSync(optionsFile, 'utf-8'));
      if(typeof data == 'object') {
        options = data;
      }
    }
  } catch(e) {
    // Nothing to report here, sadly -- because we cannot rely on Sentry at this
    // low level.
    options = {};
  }
  return options;
}

export function getOption<T extends KeymanDeveloperOption>(valueName: T, defaultValue: KeymanDeveloperOptions[T]): KeymanDeveloperOptions[T] {
  const options = loadOptions();
  return options[valueName] ?? defaultValue;
}
