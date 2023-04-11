import * as path from 'path';
import { BuildActivity, BuildActivityOptions } from './BuildActivity.js';
import { Compiler } from '@keymanapp/kmc-kmn';
import { platform } from 'os';

export class BuildKmnKeyboard implements BuildActivity {
  public get name(): string { return 'Keyman keyboard'; }
  public get sourceExtension(): string { return '.kmn'; }
  public get compiledExtension(): string { return '.kmx'; }
  public get description(): string { return 'Build a Keyman keyboard'; }
  public async build(infile: string, options: BuildActivityOptions): Promise<boolean> {
    let compiler = new Compiler();
    if(!await compiler.init()) {
      return false;
    }

    // We need to resolve paths to absolute paths before calling kmc-kmn
    let outfile = (options.outFile ?? infile).replace(/\.km.$/i, this.compiledExtension);

    infile = getPosixAbsolutePath(infile);
    outfile = getPosixAbsolutePath(outfile);

    // TODO: Currently this only builds .kmn->.kmx, and targeting .js is as-yet unsupported
    // TODO: Support additional options compilerWarningsAsErrors, warnDeprecatedCode
    return compiler.run(infile, outfile, {
      saveDebug: options.debug,
      shouldAddCompilerVersion: options.compilerVersion,
    });
  }
}

function getPosixAbsolutePath(filename: string): string {
  if(platform() == 'win32') {
    // On Win32, we need to use backslashes for path.resolve to work
    filename = filename.replace(/\//g, '\\');
  }

  // Resolve to a fully qualified absolute path
  filename = path.resolve(filename);

  if(platform() == 'win32') {
    // Ensure that we convert the result back to posix-style paths which is what
    // kmc-kmn expects. On posix platforms, we assume paths have forward slashes
    // already
    filename = filename.replace(/\\/g, '/');
  }
  return filename;
}