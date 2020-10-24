import { cosmiconfig } from 'cosmiconfig'

import { moduleName as moduleNameDefault } from './consts'

interface ProjectPath {
  platform: string
  path: string
}
interface Package {
  name: string
  version?: string
  checkSum?: string
  platform: string
}
type LicenseResolver = string | ((packageInfo: unknown) => string)
export interface LicenseGuardConfig {
  include?: Array<ProjectPath | string>
  exclude?: string[]
  defaultPlatform?: string
  plugins?: string[]
  whitelist?: Package[]
  // packageName = "package" | "package__version" | "package__version__checkSum"
  override?: { [platform in string]: { [packageName in string]: LicenseResolver } }
}

export class ModuleConfig {
  private readonly explorer = cosmiconfig(this.moduleName, {
    searchPlaces: [`${this.moduleName}.config.js`],
  })
  private readonly defaultConfig: LicenseGuardConfig = {
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
    if (res && res.config) {
      this.configInternal = {
        ...this.defaultConfig,
        ...(res.config as LicenseGuardConfig),
      }
    }
  }
}
