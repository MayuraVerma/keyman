import * as fs from 'fs';
import * as path from 'path';
import { CompilerCallbacks, CompilerSchema, CompilerEvent,
         CompilerPathCallbacks, CompilerFileSystemCallbacks,
         CompilerLogLevel, compilerLogLevelToSeverity, CompilerErrorSeverity,
         CompilerError } from '@keymanapp/common-types';
import { InfrastructureMessages } from './messages.js';
import chalk from 'chalk';
import supportsColor from 'supports-color';
/**
 * Concrete implementation for CLI use
 */

const color = chalk.default;
const severityColors: {[value in CompilerErrorSeverity]: chalk.Chalk} = {
  [CompilerErrorSeverity.Info]: color.reset,
  [CompilerErrorSeverity.Hint]: color.blueBright,
  [CompilerErrorSeverity.Warn]: color.yellowBright,
  [CompilerErrorSeverity.Error]: color.redBright,
  [CompilerErrorSeverity.Fatal]: color.redBright,
};

export interface CompilerCallbackOptions {
  logLevel?: CompilerLogLevel;
  color?: boolean; // null or undefined == use console default
}

export class NodeCompilerCallbacks implements CompilerCallbacks {
  /* NodeCompilerCallbacks */

  messages: CompilerEvent[] = [];

  constructor(private options: CompilerCallbackOptions) {
    color.enabled = this.options.color ?? (supportsColor.stdout ? supportsColor.stdout.hasBasic : false);
  }

  clear() {
    this.messages = [];
  }

  hasMessage(code: number): boolean {
    return this.messages.find((item) => item.code == code) === undefined ? false : true;
  }

  private verifyFilenameConsistency(originalFilename: string): void {
    if(fs.existsSync(originalFilename)) {
      // Note, we only check this if the file exists, because
      // if it is not found, that will be returned as an error
      // from loadFile anyway.
      const filename = fs.realpathSync(originalFilename);
      const nativeFilename = fs.realpathSync.native(filename);
      if(filename != nativeFilename) {
        this.reportMessage(InfrastructureMessages.Hint_FilenameHasDifferingCase({
          reference: originalFilename,
          filename: nativeFilename
        }));
      }
    }
  }

  /* CompilerCallbacks */

  loadFile(filename: string): Uint8Array {
    this.verifyFilenameConsistency(filename);
    try {
      return fs.readFileSync(filename);
    } catch (e) {
      if (e.code === 'ENOENT') {
        return null;
      } else {
        throw e;
      }
    }
  }

  get path(): CompilerPathCallbacks {
    return path;
  }

  get fs(): CompilerFileSystemCallbacks {
    return fs;
  }

  reportMessage(event: CompilerEvent): void {
    this.messages.push({...event});

    if(CompilerError.severity(event.code) < compilerLogLevelToSeverity[this.options.logLevel]) {
      // collect messages but don't print to console
      return;
    }

    const severityColor = severityColors[CompilerError.severity(event.code)] ?? color.reset;
    const messageColor = this.messageSpecialColor(event) ?? color.reset;
    process.stdout.write(
      (
        event.filename
        ? color.cyan(CompilerError.formatFilename(event.filename)) +
          (event.line ? ':' + color.yellowBright(CompilerError.formatLine(event.line)) : '') + ' - '
        : ''
      ) +
      severityColor(CompilerError.formatSeverity(event.code)) + ' ' +
      color.grey(CompilerError.formatCode(event.code)) + ': ' +
      messageColor(CompilerError.formatMessage(event.message)) + '\n'
    );

    if(event.code == InfrastructureMessages.INFO_ProjectBuiltSuccessfully) {
      // Special case: we'll add a blank line after project builds
      process.stdout.write('\n');
    }

  }

  /**
   * We treat a few certain infrastructure messages with special colours
   * @param event
   * @returns
   */
  messageSpecialColor(event: CompilerEvent) {
    switch(event.code) {
      case InfrastructureMessages.INFO_BuildingFile:
        return color.whiteBright;
      case InfrastructureMessages.INFO_FileNotBuiltSuccessfully:
      case InfrastructureMessages.INFO_ProjectNotBuiltSuccessfully:
        return color.red;
      case InfrastructureMessages.INFO_FileBuiltSuccessfully:
      case InfrastructureMessages.INFO_ProjectBuiltSuccessfully:
        return color.green;
    }
    return null;
  }

  debug(msg: string) {
    if(this.options.logLevel == 'debug') {
      console.debug(msg);
    }
  }

  loadSchema(schema: CompilerSchema): Uint8Array {
    let schemaPath = new URL('../util/' + schema + '.schema.json', import.meta.url);
    return fs.readFileSync(schemaPath);
  }

  fileExists(filename: string) {
    return fs.existsSync(filename);
  }

  resolveFilename(baseFilename: string, filename: string) {
    const basePath =
      baseFilename.endsWith('/') || baseFilename.endsWith('\\') ?
      baseFilename :
      path.dirname(baseFilename);
    // Transform separators to platform separators -- we are agnostic
    // in our use here but path prefers files may use
    // either / or \, although older kps files were always \.
    if(path.sep == '/') {
      filename = filename.replace(/\\/g, '/');
    } else {
      filename = filename.replace(/\//g, '\\');
    }
    if(!path.isAbsolute(filename)) {
      filename = path.resolve(basePath, filename);
    }
    return filename;
  }

}
