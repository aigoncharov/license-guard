import { LicenseResolver, ModuleConfig, PackageDescriptor, LicenseDescriptor } from '../config'
import { LicenseManager } from '../license-manager'
import { SourceCodeManager } from '../source-code-manager'

interface PackageDescriptorExtended extends PackageDescriptor {
  license: LicenseDescriptor
}

export interface AbstractPlatformStatic {
  canHandleFolder(path: string): Promise<boolean>
}

export abstract class AbstractPlatform<P extends object> {
  constructor(
    private readonly config: ModuleConfig,
    private readonly licenseManager: LicenseManager,
    private readonly sourceCodeManager: SourceCodeManager,
    public readonly path: string,
  ) {}

  public abstract readonly type: string
  public abstract async canHandleFolder(): Promise<boolean>
  public async getLicenses(includeDevOnly = false): Promise<PackageDescriptorExtended[]> {
    const platformPackages = await this.getPackages()

    let filteredPlatformPackages = platformPackages
    if (!includeDevOnly) {
      filteredPlatformPackages = filteredPlatformPackages.filter((platformPackage) => !this.getPackageDevOnly(platformPackage))
    }

    const newPlatformPackages = filteredPlatformPackages.filter(
      (platformPackage) => !this.licenseManager.has(this.getPackageDescriptor(platformPackage)),
    )
    const licenses = await Promise.all(
      newPlatformPackages.map(async (platformPackage) => {
        const override = this.config.getOverride(this.getPackageDescriptor(platformPackage))
        if (override) {
          const license = await this.getPlatformPackageLicenseOverride(platformPackage, override)
          return license
        }
        const license = await this.getPlatformPackageLicenseDefault(platformPackage)
        return license
      }),
    )

    const packagesWithMissingLicenses = []
    licenses.forEach((license, i) => {
      if (!license) {
        packagesWithMissingLicenses.push(newPlatformPackages[i])
      }
    })

    if (packagesWithMissingLicenses.length) {
      // TODO: Better error
      throw new Error()
    }

    const extendedDescriptors = newPlatformPackages.map((platformPackage, i) => ({
      ...this.getPackageDescriptor(platformPackage),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      license: licenses[i]!,
    }))

    return extendedDescriptors
  }

  protected abstract async getPackages(): Promise<P[]>
  protected abstract getPackageDescriptor(platformPackage: P): PackageDescriptor
  protected abstract getPackageSourceURL(platformPackage: P): string | undefined
  protected abstract getPackageDevOnly(platformPackage: P): boolean
  protected abstract getPackageLocalPath(platformPackage: P): string
  protected abstract getLicenseFromLocalPackage(platformPackage: P): LicenseDescriptor | undefined
  protected abstract async getLicenseFromSource(path: string): Promise<LicenseDescriptor | undefined>

  private async getPlatformPackageLicenseDefault(platformPackage: P): Promise<LicenseDescriptor | undefined> {
    const localLicense = this.getLicenseFromLocalPackage(platformPackage)
    if (localLicense) {
      return localLicense
    }

    const sourceURL = this.getPackageSourceURL(platformPackage)
    if (!sourceURL || !this.sourceCodeManager.canHandleURL(sourceURL)) {
      return undefined
    }

    const { version } = this.getPackageDescriptor(platformPackage)
    const sourceLocalPath = await this.sourceCodeManager.getSourceCode(sourceURL, version)

    const licenseFromSource = await this.getLicenseFromSource(sourceLocalPath)
    return licenseFromSource
  }

  private async getPlatformPackageLicenseOverride(platformPackage: P, override: LicenseResolver): Promise<LicenseDescriptor | undefined> {
    if (typeof override === 'object') {
      return override
    }

    const sourceURL = this.getPackageSourceURL(platformPackage)
    const descriptor = this.getPackageDescriptor(platformPackage)
    let getSource: (() => Promise<string>) | undefined
    if (sourceURL && this.sourceCodeManager.canHandleURL(sourceURL)) {
      getSource = () => this.sourceCodeManager.getSourceCode(sourceURL, descriptor.version)
    }

    const license = await override({
      raw: platformPackage,
      descriptor,
      sourceURL,
      getSource,
    })
    return license
  }
}
