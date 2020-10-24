export class SourceCodeManager {
  public canHandleURL(url: string): boolean {}
  public async getSourceCode(url: string, version: string): Promise<string> {}
}
