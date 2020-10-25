import { readFile, lstat } from 'fs/promises'
import { resolve } from 'path'

interface GetFileOptions {
  encoding?: BufferEncoding
}

export class SourceCodeExplorer {
  constructor(public readonly repoPath: string) {}

  public async getFile(relativePath: string, { encoding }: GetFileOptions = {}): Promise<string | undefined> {
    try {
      const fileFullPath = resolve(this.repoPath, relativePath)

      const stats = await lstat(fileFullPath)
      if (!stats.isFile()) {
        return undefined
      }

      const content = await readFile(fileFullPath, { encoding: encoding ?? 'utf-8', flag: 'r' })
      return content
    } catch {
      return undefined
    }
  }
}
