import { BuildActivity } from './BuildActivity.js';
import { CompilerCallbacks, CompilerOptions, KeymanFileTypes } from '@keymanapp/common-types';
import { writeMergedModelMetadataFile } from '@keymanapp/kmc-model-info';
import { KmpCompiler } from '@keymanapp/kmc-package';
import { loadProject } from '../../util/projectLoader.js';

export class BuildModelInfo extends BuildActivity {
  public get name(): string { return 'Lexical model metadata'; }
  public get sourceExtension(): KeymanFileTypes.Source { return KeymanFileTypes.Source.ModelInfo; }
  public get compiledExtension(): KeymanFileTypes.Binary { return KeymanFileTypes.Binary.ModelInfo; }
  public get description(): string { return 'Build a lexical model metadata file'; }

  /**
   * Compiles a build/ .model_info from a source .model_info file and
   * corresponding model and package data files. Data not provided in the
   * .model_info file will be extracted from the other source files.
   * @param infile a .kpj file or a .model_info file. When a .model_info file is
   *               given, will look for a .kpj in the same folder.
   * @param callbacks
   * @param options
   * @returns
   */
  public async build(infile: string, callbacks: CompilerCallbacks, options: CompilerOptions): Promise<boolean> {
    if(KeymanFileTypes.filenameIs(infile, KeymanFileTypes.Source.ModelInfo)) {
      // We are given a .model_info but need to use the project file in the
      // same folder, so that we can find the related files.
      infile = KeymanFileTypes.replaceExtension(infile, KeymanFileTypes.Source.ModelInfo, KeymanFileTypes.Source.Project);
    }
    const project = loadProject(infile, callbacks);
    if(!project) {
      // Error messages will be reported by loadProject
      return false;
    }

    const metadata = project.files.find(file => file.getFileType() == KeymanFileTypes.Source.ModelInfo);
    if(!metadata) {
      // TODO error
      throw new Error('Missing .model_info file');
    }

    const model = project.files.find(file => file.getFileType() == KeymanFileTypes.Source.Model);
    if(!model) {
      // TODO error
      throw new Error('Missing .model.ts file');
    }

    const kps = project.files.find(file => file.getFileType() == KeymanFileTypes.Source.Package);
    if(!kps) {
      // TODO error
      throw new Error('Missing .kps file');
    }

    let kmpCompiler = new KmpCompiler(callbacks);
    let kmpJsonData = kmpCompiler.transformKpsToKmpObject(project.resolveInputFilePath(kps));
    if(!kmpJsonData) {
      // TODO error
      throw new Error('Invalid .kps file');
    }

    writeMergedModelMetadataFile(
      project.resolveInputFilePath(metadata),
      project.resolveOutputFilePath(metadata, KeymanFileTypes.Source.ModelInfo, KeymanFileTypes.Binary.ModelInfo),
      {
        model_id: callbacks.path.basename(metadata.filename, KeymanFileTypes.Source.ModelInfo),
        kmpJsonData,
        sourcePath: null, //TODO
        modelFileName: project.resolveOutputFilePath(model, KeymanFileTypes.Source.Model, KeymanFileTypes.Binary.Model),
        kmpFileName: project.resolveOutputFilePath(kps, KeymanFileTypes.Source.Package, KeymanFileTypes.Binary.Package),
      }
    );

    // Output:
    // TODO fs.writeFileSync(options.outFile, code, 'utf8');

    return true;
  }
}