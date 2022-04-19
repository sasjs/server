import { readFile } from '@sasjs/utils'
import express from 'express'
import path from 'path'
import { getWebBuildFolderPath } from '../../utils'

const webRouter = express.Router()

const jsCodeForDesktopMode = `
<script>
  localStorage.setItem('accessToken', JSON.stringify('accessToken'))
  localStorage.setItem('refreshToken', JSON.stringify('refreshToken'))
</script>`

const jsCodeForServerMode = `
<script>
  localStorage.setItem('CLIENT_ID', '${process.env.CLIENT_ID}')
</script>`

webRouter.get('/', async (_, res) => {
  let content: string
  try {
    const indexHtmlPath = path.join(getWebBuildFolderPath(), 'index.html')
    content = await readFile(indexHtmlPath)
  } catch (_) {
    return res.send('Web Build is not present')
  }

  const { MODE } = process.env
  const codeToInject =
    MODE?.trim() === 'server' ? jsCodeForServerMode : jsCodeForDesktopMode
  const injectedContent = content.replace('</head>', `${codeToInject}</head>`)

  res.setHeader('Content-Type', 'text/html')
  return res.send(injectedContent)
})

export default webRouter
