import { Express } from 'express'
import request from 'supertest'
import appPromise from '../../../app'

describe('Info', () => {
  let app: Express

  beforeAll(async () => {
    app = await appPromise
  })

  it('should should return configured information of the server instance', async () => {
    const res = await request(app).get('/SASjsApi/info').expect(200)

    expect(res.body.mode).toEqual('server')
    expect(res.body.cors).toEqual('disable')
    expect(res.body.whiteList).toEqual([])
    expect(res.body.protocol).toEqual('http')
  })
})
