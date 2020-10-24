import { PackageSource } from '../source-code-resolvers/core'

interface LicenseDescriptor {
  name?: string
  path?: string
  text?: string
}
interface PackageDescriptor {
  name: string
  version: string
  path: string
  license?: LicenseDescriptor
  checkSum?: string
  platform: string
  devOnly?: boolean
  source?: PackageSource
}

export interface AbstractPlatformStatic {
  canHandleFolder(path: string): Promise<boolean>
}

export abstract class AbstractPlatform<P extends object> {
  constructor(public readonly path: string) {}

  public abstract readonly type: string
  public abstract async canHandleFolder(): Promise<boolean>
  public async getLicenses(includeDevOnly = false): Promise<PackageDescriptor[]> {
    const platformPackages = await this.getPackages()
  }

  protected abstract async getPackages(): Promise<P[]>
  protected abstract getLicenseFromLocalPackage(platformPackage: P): LicenseDescriptor

  protected abstract getLicenseFromSourceControl(repo: object): LicenseDescriptor
}
