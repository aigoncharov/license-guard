import { cosmiconfig } from 'cosmiconfig'
import { isAbsolute, resolve } from 'path'

import { defaultOutFile, moduleName as moduleNameDefault } from './consts'

interface ProjectPath {
  platform: string
  path: string
}
export interface PackageDescriptor {
  name: string
  version: string
  platform: string
  checkSum?: string
}
interface WhitelistPackage {
  name: string
  version?: string
  checkSum?: string
  platform: string
}

export type LicenseDescriptor =
  | {
      name: string
      path?: string
      text?: string
    }
  | {
      name?: string
      path: string
      text?: string
    }
  | {
      name?: string
      path?: string
      text: string
    }
interface LicenseResolverProps {
  raw: object
  descriptor: PackageDescriptor
  sourceURL?: string
  getSource?: () => Promise<string>
}
export type LicenseResolver = LicenseDescriptor | ((props: LicenseResolverProps) => LicenseDescriptor | Promise<LicenseDescriptor>)
export interface LicenseGuardConfig {
  outFile: string
  include: Array<ProjectPath | string>
  exclude?: string[]
  defaultPlatform: string
  plugins?: string[]
  whitelist?: WhitelistPackage[]
  // packageName = "package" | "package__version" | "package__version__checkSum"
  override?: { [platform in string]: { [packageName in string]: LicenseResolver } }
}

export class ModuleConfig {
  private readonly explorer = cosmiconfig(this.moduleName, {
    searchPlaces: [`${this.moduleName}.config.js`],
  })
  private readonly defaultConfig: LicenseGuardConfig = {
    outFile: `./${defaultOutFile}`,
    include: [process.cwd()],
    defaultPlatform: 'npm',
  }
  private configInternal?: LicenseGuardConfig

  constructor(private readonly moduleName = moduleNameDefault) {}

  public get config() {
    return this.configInternal
  }

  public async load() {
    const res = await this.explorer.search()

    this.configInternal = this.defaultConfig

    if (res && res.config) {
      this.configInternal = {
        ...this.configInternal,
        ...(res.config as LicenseGuardConfig),
      }
    }

    if (!isAbsolute(this.configInternal.outFile)) {
      this.configInternal.outFile = resolve(process.cwd(), this.configInternal.outFile)
    }
  }

  public getOverride(packageDescriptor: PackageDescriptor): LicenseResolver | undefined {}
}
