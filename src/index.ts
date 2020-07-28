import * as http from 'http'
import * as socket from 'socket.io'
import * as fs from 'fs'

interface IConfig {
  stream: string,
  name: string,
  path: string
}

class ServerIO {

  httpServer = http.createServer()
  io = socket(this.httpServer)
  configPath = '/var/log/logeasy/config.json'
  configs: IConfig[] = this.getConfig()
  client: socket.Socket

  getLastLine (name: string) {
    const filePath = this.configs.find( config => config.name === name ).path
    if (!fs.existsSync(filePath)){ return console.log(`${filePath} don't exists`) }
    const file = fs.readFileSync(filePath, 'utf8')
    const lines = file.split('\n')
    const lastLine = lines[lines.length - 2]
    return lastLine
  }

  watch() {
    this.configs.forEach(config => {
      fs.watchFile(config.path, () => {
        console.log('config.name: ', config.name)
        this.client && this.client.emit('append', {
          stream: config.stream,
          name: config.name,
          message: this.getLastLine(config.name)
        })
      });
    })
  }

  getConfig (): IConfig[] {
    try {
      const file = fs.readFileSync(this.configPath, 'utf8')
      return JSON.parse(file)
    } catch (err) {
      console.error('Error reading /var/log/logeasy/config.json file', err)
      throw err
    }
  }

  getLogs (): IConfig[] {
    const logs = []
    this.configs.forEach( config => {
      try {
        const file = fs.readFileSync(config.path, 'utf8')
        const messages = file.split('\n')
        messages.pop()
        logs.push({
          stream: config.stream,
          name: config.name,
          messages
        })
      } catch (err) {
        console.error(`Error reading ${config.path} file, does it exists?`)
        throw err
      }
    })
    return logs
  }

  start() {
    process.setMaxListeners(0)
    this.createLogeasyFolder()
    this.watch()
    this.io.on('connection', client => {
      this.client = client
      client.emit('connected', {
        configs: this.getConfig(),
        logs: this.getLogs()
      })
    })

    this.httpServer.listen(3666, '0.0.0.0')
  }

  createLogeasyFolder () {
    const dir = '/var/log/logeasy';
    if (!fs.existsSync(dir)){
      return fs.mkdirSync(dir);
    }
    console.log(`${dir} dir already exists`)
  }
}

const serverIO = new ServerIO()
serverIO.start()