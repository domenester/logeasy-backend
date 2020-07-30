import * as socket from 'socket.io'
import FileService from '../service/file.service'
import ConfigService from '../service/config.service'
import HttpServer from './http.server'

export default class SocketServer {

  client: socket.Socket
  configService = new ConfigService()
  fileService = new FileService(
  this,
  this.configService.getConfig()
  )
  httpServer = new HttpServer(
    this.configService.getConfig(),
    this.fileService
  )
  io = socket(this.httpServer.getServer())
    
  start() {
    const { fileService, configService } = this
    process.setMaxListeners(0)
    fileService.createLogeasyFolderAndFiles()
    fileService.watch()
    this.io.on('connection', client => {
      this.setClient(client)
      client.emit('connected', {
        configs: configService.getConfig(),
        logs: fileService.getLogs()
      })
    })

    this.httpServer.listen(3666, '0.0.0.0')
  }

  getClient () {
    return this.client
  }

  setClient (client: socket.Socket) {
    this.client = client
  }
}