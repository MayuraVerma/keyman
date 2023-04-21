import { CompilerErrorNamespace, CompilerErrorSeverity, CompilerEvent, CompilerMessageSpec as m } from "@keymanapp/common-types";

const Namespace = CompilerErrorNamespace.KmnCompiler;
const SevInfo = CompilerErrorSeverity.Info | Namespace;
const SevHint = CompilerErrorSeverity.Hint | Namespace;
const SevWarn = CompilerErrorSeverity.Warn | Namespace;
const SevError = CompilerErrorSeverity.Error | Namespace;
const SevFatal = CompilerErrorSeverity.Fatal | Namespace;

/**
 * LogLevel comes from kmn_compiler_errors.h, for legacy compiler error messages
 */
const enum LogLevel {
  LEVEL_MASK = 0xF000,
  CODE_MASK = 0x0FFF,
  CERR_FATAL = 0x8000,
  CERR_ERROR = 0x4000,
  CERR_WARNING = 0x2000,
  CERR_HINT = 0x1000,
  CERR_INFO = 0
};

/**
 * Translate the legacy compiler error messages to Severity codes
 */
const LogLevelToSeverity: Record<number,number> = {
  [LogLevel.CERR_FATAL]:   SevFatal,
  [LogLevel.CERR_ERROR]:   SevError,
  [LogLevel.CERR_WARNING]: SevWarn,
  [LogLevel.CERR_HINT]:    SevHint,
  [LogLevel.CERR_INFO]:    SevInfo
}

/*
  The messages in this class share the namespace with messages from kmn_compiler_errors.h
  and the below ranges are reserved.
*/
export class CompilerMessages {
  static RANGE_KMN_COMPILER_MIN    = 0x0001; // from kmn_compiler_errors.h
  static RANGE_KMN_COMPILER_MAX    = 0x07FF; // from kmn_compiler_errors.h
  static RANGE_LEXICAL_MODEL_MIN   = 0x0800; // from kmn_compiler_errors.h, deprecated -- this range will not be used in future versions
  static RANGE_LEXICAL_MODEL_MAX   = 0x08FF; // from kmn_compiler_errors.h, deprecated -- this range will not be used in future versions
  static RANGE_CompilerMessage_Min = 0x1000; // All compiler messages listed here must be >= this value

  static Fatal_UnexpectedException = (o:{e: any}) => m(this.FATAL_UnexpectedException, `Unexpected exception: ${(o.e ?? 'unknown error').toString()}\n\nCall stack:\n${(o.e instanceof Error ? o.e.stack : (new Error()).stack)}`);
  static FATAL_UnexpectedException = SevFatal | 0x1000;

  static Fatal_MissingWasmModule = () => m(this.FATAL_MissingWasmModule, `Could not instanatiate WASM compiler module`);
  static FATAL_MissingWasmModule = SevFatal | 0x1001;

  static Fatal_UnableToSetCompilerOptions = () => m(this.FATAL_UnableToSetCompilerOptions, `Unable to set compiler options`);
  static FATAL_UnableToSetCompilerOptions = SevFatal | 0x1002;

  static mapErrorFromKmcmplib = (line: number, code: number, msg: string): CompilerEvent => {
    const severity = LogLevelToSeverity[code & LogLevel.LEVEL_MASK];
    const baseCode = code & LogLevel.CODE_MASK;
    const event: CompilerEvent = {
      line: line,
      code: severity | CompilerErrorNamespace.KmnCompiler | baseCode,
      message: msg
    };
    return event;
  };
}

