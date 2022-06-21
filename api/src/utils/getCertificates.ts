import path from 'path'
import { fileExists, getString, readFile } from '@sasjs/utils'

export const getCertificates = async () => {
  const { PRIVATE_KEY, CERT_CHAIN, CA_ROOT } = process.env

  let ca

  const keyPath = PRIVATE_KEY ?? (await getFileInput('Private Key (PEM)'))
  const certPath = CERT_CHAIN ?? (await getFileInput('Certificate Chain (PEM)'))
  const caPath = CA_ROOT

  console.log('keyPath: ', keyPath)
  console.log('certPath: ', certPath)
  if (caPath) console.log('caPath: ', caPath)

  const key = await readFile(keyPath)
  const cert = await readFile(certPath)
  if (caPath) ca = await readFile(caPath)

  return { key, cert, ca }
}

const getFileInput = async (
  filename: string,
  required: boolean = true
): Promise<string> => {
  const validator = async (filePath: string) => {
    if (!required) return true

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
