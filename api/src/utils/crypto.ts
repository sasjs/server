import { randomBytes } from 'crypto'

export const randomBytesHexString = (bytesCount: number) =>
  randomBytes(bytesCount).toString('hex')
