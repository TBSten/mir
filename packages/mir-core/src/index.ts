// errors
export {
  MirError,
  ValidationError,
  SnippetNotFoundError,
  SnippetAlreadyExistsError,
  RegistryNotFoundError,
  RegistryRemoteError,
  PathTraversalError,
  FileConflictError,
  RemoteRegistryFetchError,
  InvalidManifestError,
} from "./errors.js";

// snippet-schema
export {
  parseSnippetYaml,
  serializeSnippetYaml,
  validateSnippetDefinition,
} from "./snippet-schema.js";
export type {
  VariableSchema,
  VariableDefinition,
  Action,
  SnippetDefinition,
} from "./snippet-schema.js";

// validate-name
export { validateSnippetName } from "./validate-name.js";

// safe-yaml-parser
export {
  safeParseYaml,
  checkNoRefInSchema,
  YAML_MAX_SIZE_BYTES,
} from "./safe-yaml-parser.js";

// template-engine
export {
  expandTemplate,
  expandPath,
  extractVariables,
  extractVariablesFromDirectory,
  expandTemplateDirectory,
} from "./template-engine.js";

// hooks
export { ExitHookError, executeHooks } from "./hooks.js";
export type { HookExecutionOptions } from "./hooks.js";

// registry
export {
  listRegistrySnippets,
  snippetExistsInRegistry,
  readSnippetFromRegistry,
  listTemplateFiles,
  readTemplateFile,
  copySnippetToRegistry,
  removeSnippetFromRegistry,
} from "./registry.js";

// remote-registry
export {
  fetchRegistryManifest,
  listRemoteSnippets,
  fetchSnippetDefinition,
  fetchRemoteFiles,
  fetchRemoteSnippet,
  expandRemoteTemplateFiles,
} from "./remote-registry.js";
export type { RegistryManifest, RemoteSnippet, FetchOptions } from "./remote-registry.js";

// symlink-checker
export {
  isSymbolicLink,
  findSymlinksInDirectory,
} from "./lib/symlink-checker.js";
export type { SymlinkCheckResult } from "./lib/symlink-checker.js";

// i18n
export { setLocale, getLocale, t } from "./i18n/index.js";
export type { Locale } from "./i18n/index.js";
export type { MessageKey, MessageCatalog } from "./i18n/types.js";
