declare module 'read-installed' {
  export interface ReadInstalledOptions<Dev extends boolean> {
    dev?: Dev
    log?: (message: string) => void
    depth?: number
  }
  export interface Package<Dev extends boolean> {
    name: string
    version: string
    repository?: {
      type: 'git' | string
      url: string
    }
    license?: string
    readme?: string
    readmeFilename?: string
    gitHead?: string
    path: string
    realPath: string
    depth: number
    root?: boolean
    peerDependencies: {}
    dependencies: {}
    devDependencies: Dev extends true ? { [packageName: string]: Package<Dev> } : { [packageName: string]: string }
  }

  const readInstalled: <Dev extends boolean>(
    folder: string,
    options: ReadInstalledOptions<Dev>,
    cb: (err: Error | null, data: Package<Dev>) => void,
  ) => void

  export default readInstalled
}
