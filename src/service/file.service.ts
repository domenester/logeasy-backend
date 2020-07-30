import * as fs from 'fs'
import { IConfig } from './config.service'
import { IInsertLog } from '../server/http.server'
import SocketServer from '../server/socket.server'



export default class FileService {

  constructor(
    private socketService: SocketServer,
    private configs: IConfig[]
  ) {}

  getLastLog (stream: string, name: string) {
    const config = this.configs.find( config => config.stream === stream && config.name === name )
    if (!config){ return console.log(`Not found configs for stream ${stream} and name ${name}`) }
    const filePath = config.path
    if (!fs.existsSync(filePath)){ return console.log(`${filePath} don't exists`) }
    const file = fs.readFileSync(filePath, 'utf8')
    const json = file ? JSON.parse(file) : []
    return json.length ? json[json.length - 1] : json
  }

  watch() {
    this.configs.forEach(config => {
      fs.watchFile(config.path, () => {
        const client = this.socketService.getClient()
        if (!client) {
          return console.log('No client connected to watchFile event')
        }
        client.emit('append', {
          stream: config.stream,
          name: config.name,
          log: this.getLastLog(config.stream, config.name)
        })
      });
    })
  }

  insertLog (body: IInsertLog): Promise<void> {
    return new Promise(
      (resolve) => {
        const config = this.configs.find(
          config =>
            body.stream.toUpperCase() === config.stream.toUpperCase() &&
            body.name.toUpperCase() === config.name.toUpperCase()
        )
        if (!config) {
          throw new Error(`Not found a config with stream  "${body.stream}" and name ${body.name}`)
        }
        const file = fs.readFileSync(config.path, 'utf8')
        const { severity, message } = body
        const json = [ ...(file && JSON.parse(file)), { severity, message, date: new Date() } ]
        fs.writeFileSync(config.path, JSON.stringify(json))
        resolve()
      }
    )
  }

  getLogs (): IConfig[] {
    const logs = []
    this.configs.forEach( config => {
      try {
        const file = fs.readFileSync(config.path, 'utf8')
        logs.push({
          stream: config.stream,
          name: config.name,
          logs: file ? JSON.parse(file) : []
        })
      } catch (err) {
        console.error(`Error reading ${config.path} file, does it exists?`)
        throw err
      }
    })
    return logs
  }

  createEmptyFile (path: string) {
    fs.closeSync(fs.openSync(path, 'w'));
  }

  createLogeasyFolderAndFiles () {
    const dir = '/var/log/logeasy';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    this.configs.forEach( config => {
      if (!fs.existsSync(config.path)){
        this.createEmptyFile(config.path)
      } 
    })
  }
}