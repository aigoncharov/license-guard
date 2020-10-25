export class SourceCodeExplorer {
  constructor(public readonly repoPath: string) {}

  public async getFile(relativePath: string): Promise<string | undefined> {}
}
