import express from 'express'
import url from 'url'

export const getFullUrl = (req: express.Request) =>
  url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  })

export const getServerUrl = (req: express.Request) =>
  url.format({
    protocol: req.protocol,
    host: req.get('x-forwarded-host') || req.get('host')
  })
