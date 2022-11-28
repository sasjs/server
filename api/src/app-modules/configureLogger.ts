import path from 'path'
import { Express } from 'express'
import morgan from 'morgan'
import { createStream } from 'rotating-file-stream'
import { generateTimestamp } from '@sasjs/utils'
import { getLogFolder } from '../utils'

export const configureLogger = (app: Express) => {
  const { LOG_FORMAT_MORGAN } = process.env

  let options
  if (
    process.env.NODE_ENV !== 'development' &&
    process.env.NODE_ENV !== 'test'
  ) {
    const timestamp = generateTimestamp()
    const filename = `${timestamp}.log`
    const logsFolder = getLogFolder()

    // create a rotating write stream
    var accessLogStream = createStream(filename, {
      interval: '1d', // rotate daily
      path: logsFolder
    })

    process.logger.info('Writing Logs to :', path.join(logsFolder, filename))

    options = { stream: accessLogStream }
  }

  // setup the logger
  app.use(morgan(LOG_FORMAT_MORGAN as string, options))
}
