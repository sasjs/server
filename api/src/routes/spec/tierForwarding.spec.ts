import express from 'express'
import request from 'supertest'

jest.mock('../api', () => ({
  __esModule: true,
  default: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    res.locals.forwarded = { url: req.url, baseUrl: req.baseUrl }
    next(req.query.fail === '1' ? new Error('forwarded failure') : undefined)
  }
}))
jest.mock('../web', () => ({
  __esModule: true,
  default: (req: express.Request, res: express.Response) =>
    res.json({
      forwarded: res.locals.forwarded,
      url: req.url,
      baseUrl: req.baseUrl
    })
}))
jest.mock('../legacyRouteRedirects', () => ({
  legacyRouteRedirects: (_req: unknown, _res: unknown, next: () => void) =>
    next()
}))
jest.mock('../ddcHost', () => ({
  ddcHostRouter: (_req: unknown, _res: unknown, next: () => void) => next()
}))
jest.mock('../appStream', () => ({
  __esModule: true,
  default: (_req: unknown, _res: unknown, next: () => void) => next()
}))
jest.mock('../viya/services', () => ({ isViyaEmulationEnabled: () => false }))

import { setupRoutes } from '../setupRoutes'

describe('web tier router forwarding', () => {
  it.each([
    ['/StoredProgram', '_PrOgRaM'],
    ['/SASJobExecution', '_file']
  ])('does not treat a child of %s as the tier itself', async (tier, key) => {
    const app = express()
    setupRoutes(app)
    const url = `${tier}/other?${key}=%2Fexample`
    const res = await request(app).get(url).expect(200)
    expect(res.body).toEqual({ url, baseUrl: '' })
  })

  it.each([
    ['/StoredProgram', '_PrOgRaM', '/stp/execute', '_program'],
    ['/SASJobExecution', '_file', '/drive/file', '_FILE']
  ])(
    'forwards raw unrelated pairs and restores the original URL on fallthrough: %s',
    async (tier, key, destination, canonical) => {
      const app = express()
      setupRoutes(app)
      const search = `?${key}=%2Fa%2Bb&x=a+b%26c&x=2&toString=v`
      const res = await request(app).get(`${tier}${search}`).expect(200)
      expect(res.body).toEqual({
        forwarded: {
          url: `${destination}?${canonical}=%2Fa%2Bb&x=a+b%26c&x=2&tostring=v`,
          baseUrl: '/SASjsApi'
        },
        url: `${tier}${search}`,
        baseUrl: ''
      })
    }
  )

  it.each([
    ['/StoredProgram', '_PROGRAM', '/stp/execute', '_program'],
    ['/SASJobExecution', '_file', '/drive/file', '_FILE']
  ])(
    'restores URL and baseUrl before forwarding an error: %s',
    async (tier, key, destination, canonical) => {
      const app = express()
      setupRoutes(app)
      app.use(
        (
          error: Error,
          req: express.Request,
          res: express.Response,
          _next: express.NextFunction
        ) => {
          res.status(500).json({
            message: error.message,
            forwarded: res.locals.forwarded,
            url: req.url,
            baseUrl: req.baseUrl
          })
        }
      )
      const search = `?${key}=%2Ftest&fail=1`
      const res = await request(app).get(`${tier}${search}`).expect(500)
      expect(res.body).toEqual({
        message: 'forwarded failure',
        forwarded: {
          url: `${destination}?${canonical}=%2Ftest&fail=1`,
          baseUrl: '/SASjsApi'
        },
        url: `${tier}${search}`,
        baseUrl: ''
      })
    }
  )
})
