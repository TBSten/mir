export class MirError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MirError";
  }
}

export class ValidationError extends MirError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class SnippetNotFoundError extends MirError {
  constructor(name: string) {
    super(`Snippet "${name}" が見つかりません`);
    this.name = "SnippetNotFoundError";
  }
}

export class SnippetAlreadyExistsError extends MirError {
  constructor(name: string) {
    super(`Snippet "${name}" は既に存在します`);
    this.name = "SnippetAlreadyExistsError";
  }
}

export class RegistryNotFoundError extends MirError {
  constructor(name: string) {
    super(`Registry "${name}" が見つかりません`);
    this.name = "RegistryNotFoundError";
  }
}

export class PathTraversalError extends MirError {
  constructor(filePath: string) {
    super(`パス "${filePath}" は出力ディレクトリの外を参照しています`);
    this.name = "PathTraversalError";
  }
}

export class FileConflictError extends MirError {
  constructor(filePath: string) {
    super(`ファイル "${filePath}" は既に存在します`);
    this.name = "FileConflictError";
  }
}

export class RegistryRemoteError extends MirError {
  constructor(name?: string) {
    super(
      name
        ? `Registry "${name}" はリモート registry のため publish できません`
        : `リモート registry には publish できません`,
    );
    this.name = "RegistryRemoteError";
  }
}
