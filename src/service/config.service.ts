import * as fs from 'fs'

export interface IConfig {
  stream: string,
  name: string,
  path: string
}

export default class ConfigService {

  private configPath = '/var/log/logeasy/config.json'
  private configs: IConfig[]

  constructor() {
    this.configs = this.startConfig()
  }

  startConfig (): IConfig[] {
    try {
      const file = fs.readFileSync(this.configPath, 'utf8')
      return JSON.parse(file)
    } catch (err) {
      console.error('Error reading /var/log/logeasy/config.json file', err)
      throw err
    }
  }

  getConfig (): IConfig[] {
    return this.configs
  }
}
