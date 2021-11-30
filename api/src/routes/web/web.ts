import { readFile } from '@sasjs/utils'
import express from 'express'
import path from 'path'
import { getWebBuildFolderPath } from '../../utils'

const webRouter = express.Router()

const codeToInject = `
<script>
  localStorage.setItem('accessToken', JSON.stringify('accessToken'))
  localStorage.setItem('refreshToken', JSON.stringify('refreshToken'))
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
  if (MODE?.trim() !== 'server') {
    const injectedContent = content.replace('</head>', `${codeToInject}</head>`)

    res.setHeader('Content-Type', 'text/html')
    return res.send(injectedContent)
  }

  return res.send(content)
})

export default webRouter
