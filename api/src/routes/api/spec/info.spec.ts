import { Express } from 'express'
import request from 'supertest'
import appPromise from '../../../app'

let app: Express

describe('Info', () => {
  it('should should return configured information of the server instance', async () => {
    await appPromise.then((_app) => {
      app = _app
    })
    request(app).get('/SASjsApi/info').expect(200)
  })
})
