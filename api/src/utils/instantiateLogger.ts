import { LogLevel, Logger } from '@sasjs/utils/logger'

export const instantiateLogger = () => {
  const logLevel = (process.env.LOG_LEVEL || LogLevel.Info) as LogLevel
  const logger = new Logger(logLevel)
  process.logger = logger
}
