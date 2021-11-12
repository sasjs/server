import { readFile } from '@sasjs/utils'
import express from 'express'
import path from 'path'
import { getWebBuildFolderPath } from '../../utils'

const webRouter = express.Router()

webRouter.get('/', async (_, res) => {
  const indexHtmlPath = path.join(getWebBuildFolderPath(), 'index.html')

  const { MODE } = process.env
  if (MODE?.trim() !== 'server') {
    const content = await readFile(indexHtmlPath)

    const codeToInject = `
    <script>
      localStorage.setItem('accessToken', JSON.stringify('accessToken'))
      localStorage.setItem('refreshToken', JSON.stringify('refreshToken'))
    </script>`
    const injectedContent = content.replace('</head>', `${codeToInject}</head>`)

    res.setHeader('Content-Type', 'text/html')
    return res.send(injectedContent)
  }

  res.sendFile(indexHtmlPath)
})

export default webRouter
