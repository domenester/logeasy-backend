import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as http from 'http'
import * as koaBodyParser from 'koa-bodyparser'
import { IConfig } from '../service/config.service'
import FileService from '../service/file.service'

export interface IInsertLog {
  stream: string
  name: string
  severity: string
  message: string
  date: string
}

export default class HttpServer {
  private app = new Koa()
  private router = new Router()
  private server: http.Server

  constructor(
    private configs: IConfig[],
    private fileService: FileService
  ) {
    this.startRoutes()
    this.setServer()
  }

  getServer () {
    return this.server
  }

  setServer () {
    this.server = http.createServer(this.app.callback())
  }

  listen (port: number, host: string) {
    this.server.listen(port, host)
    console.log(`Listening to ${host}:${port}`)
  }

  startRoutes () {
    const { router, app } = this
    router.post('/', async (ctx, next) => {
      const { request: { body } } = ctx
      await this.fileService.insertLog(body)
        .catch( err => {
          ctx.throw(400, err)
        })
      ctx.body = { statusCode: 201, message: 'Log Inserted' }
    })
    app
      .use(koaBodyParser())
      .use(router.routes())
  }
}