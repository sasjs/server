import { readFile } from '@sasjs/utils'
import express from 'express'
import path from 'path'
import { Request, Post, Get } from 'tsoa'

export interface Sas9Response {
  content: string
  redirect?: string
  error?: boolean
}

export interface MockFileRead {
  content: string
  error?: boolean
}

export class MockSas9Controller {
  private loggedIn: boolean = false

  @Get('/SASStoredProcess')
  public async sasStoredProcess(
    @Request() req: express.Request
  ): Promise<Sas9Response> {
    let username = req.query._username?.toString() || undefined
    let password = req.query._password?.toString() || undefined
    
    if (username && password) this.loggedIn = true
    
    if (!this.loggedIn) {
      return {
        content: '',
        redirect: '/SASLogon/login'
      }
    }

    let program = req.query._program?.toString() || undefined
    let filePath: string[] = [
      'generic',
      'sas9',
      'sas-stored-process'
    ]

    if (program) {
      filePath = program.replace('/', '').split('/')
    }

    return await getMockResponseFromFile([
      process.cwd(),
      'mocks',
      ...filePath
    ])
  }

  @Get('/SASStoredProcess/do')
  public async sasStoredProcessDoGet(
    @Request() req: express.Request
  ): Promise<Sas9Response> {
    let username = req.query._username?.toString() || undefined
    let password = req.query._password?.toString() || undefined
    
    if (username && password) this.loggedIn = true
    
    if (!this.loggedIn) {
      return {
        content: '',
        redirect: '/SASLogon/login'
      }
    }

    let program = req.query._program?.toString() || undefined
    let filePath: string[] = [
      'generic',
      'sas9',
      'sas-stored-process'
    ]

    if (program) {
      filePath = `${program}-login`.replace('/', '').split('/')
    }

    return await getMockResponseFromFile([
      process.cwd(),
      'mocks',
      ...filePath
    ])
  }

  @Post('/SASStoredProcess/do/')
  public async sasStoredProcessDoPost(
    @Request() req: express.Request
  ): Promise<Sas9Response> {
    if (!this.loggedIn) {
      return {
        content: '',
        redirect: '/SASLogon/login'
      }
    }

    let program = req.query._program?.toString() || ''
    program = program.replace('/', '')
    let debug = req.query._debug?.toString()

    if (program.includes('runner') && debug === 'log') {
      program += '-log' //runner-log
    }

    const content = await getMockResponseFromFile([
      process.cwd(),
      'mocks',
      ...program.split('/')
    ])

    if (content.error) {
      return content
    }

    const parsedContent = parseJsonIfValid(content.content)

    return {
      content: parsedContent
    }
  }

  @Get('/SASLogon/login')
  public async loginGet(): Promise<Sas9Response> {
    return await getMockResponseFromFile([
      process.cwd(),
      'mocks',
      'generic',
      'sas9',
      'login'
    ])
  }

  @Post('/SASLogon/login')
  public async loginPost(req: express.Request): Promise<Sas9Response> {
    if (req.body.lt && req.body.lt !== 'validtoken') return {
      content: '',
      redirect: '/SASLogon/login',
    }

    this.loggedIn = true

    return await getMockResponseFromFile([
      process.cwd(),
      'mocks',
      'generic',
      'sas9',
      'logged-in'
    ])
  }

  @Get('/SASLogon/logout')
  public async logout(): Promise<Sas9Response> {
    this.loggedIn = false

    return await getMockResponseFromFile([
      process.cwd(),
      'mocks',
      'generic',
      'sas9',
      'logged-out'
    ])
  }
}

/**
 * If JSON is valid it will be parsed otherwise will return text unaltered
 * @param content string to be parsed
 * @returns JSON or string
 */
const parseJsonIfValid = (content: string) => {
  let fileContent = ''

  try {
    fileContent = JSON.parse(content)
  } catch (err: any) {
    fileContent = content
  }

  return fileContent
}

const getMockResponseFromFile = async (
  filePath: string[]
): Promise<MockFileRead> => {
  const filePathParsed = path.join(...filePath)
  let error: boolean = false

  let file = await readFile(filePathParsed).catch((err: any) => {
    const errMsg = `Error reading mocked file on path: ${filePathParsed}\nError: ${err}`
    console.error(errMsg)

    error = true

    return errMsg
  })

  return {
    content: file,
    error: error
  }
}
