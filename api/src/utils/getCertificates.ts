import path from 'path'
import { fileExists, getString, readFile } from '@sasjs/utils'

export const getCertificates = async () => {
  const { PRIVATE_KEY, FULL_CHAIN, CA } = process.env

  const keyPath = PRIVATE_KEY ?? (await getFileInput('Private Key (PEM)'))
  const certPath = FULL_CHAIN ?? (await getFileInput('Full Chain (PEM)'))
  const caPath = CA ?? (await getFileInput('Full Chain (PEM)'))

  console.log('keyPath: ', keyPath)
  console.log('certPath: ', certPath)
  console.log('caPath: ', caPath)

  const key = await readFile(keyPath)
  const cert = await readFile(certPath)
  const ca = await readFile(caPath)

  return { key, cert, ca }
}

const getFileInput = async (filename: string): Promise<string> => {
  const validator = async (filePath: string) => {
    if (!filePath) return `Path to ${filename} is required.`

    if (!(await fileExists(path.join(process.cwd(), filePath)))) {
      return 'No file found at provided path.'
    }

    return true
  }

  const targetName = await getString(
    `Please enter path to ${filename} (relative path): `,
    validator
  )

  return targetName
}
