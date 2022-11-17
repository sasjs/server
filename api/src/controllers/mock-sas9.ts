import { readFile } from '@sasjs/utils'
import express from 'express'
import path from 'path'
import { Request, Post, Get } from 'tsoa'
import dotenv from 'dotenv'
import { ExecutionController } from './internal'
import {
  getPreProgramVariables,
  getRunTimeAndFilePath,
  makeFilesNamesMap
} from '../utils'
import { MulterFile } from '../types/Upload'

dotenv.config()

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
  private loggedIn: string | undefined
  private mocksPath = process.env.STATIC_MOCK_LOCATION || 'mocks'

  @Get('/SASStoredProcess')
  public async sasStoredProcess(
    @Request() req: express.Request
  ): Promise<Sas9Response> {
    const username = req.query._username?.toString() || undefined
    const password = req.query._password?.toString() || undefined

    if (username && password) this.loggedIn = req.body.username

    if (!this.loggedIn) {
      return {
        content: '',
        redirect: '/SASLogon/login'
      }
    }

    let program = req.query._program?.toString() || undefined
    const filePath: string[] = program
      ? program.replace('/', '').split('/')
      : ['generic', 'sas-stored-process']

    if (program) {
      return await getMockResponseFromFile([
        process.cwd(),
        this.mocksPath,
        'sas9',
        ...filePath
      ])
    }

    return await getMockResponseFromFile([
      process.cwd(),
      'mocks',
      'sas9',
      ...filePath
    ])
  }

  @Get('/SASStoredProcess/do')
  public async sasStoredProcessDoGet(
    @Request() req: express.Request
  ): Promise<Sas9Response> {
    const username = req.query._username?.toString() || undefined
    const password = req.query._password?.toString() || undefined

    if (username && password) this.loggedIn = username

    if (!this.loggedIn) {
      return {
        content: '',
        redirect: '/SASLogon/login'
      }
    }

    const program = req.query._program ?? req.body?._program
    const filePath: string[] = ['generic', 'sas-stored-process']

    if (program) {
      const vars = { ...req.query, ...req.body, _requestMethod: req.method }
      const otherArgs = {}

      try {
        const { codePath, runTime } = await getRunTimeAndFilePath(
          program + '.js'
        )

        const result = await new ExecutionController().executeFile({
          programPath: codePath,
          preProgramVariables: getPreProgramVariables(req),
          vars: vars,
          otherArgs: otherArgs,
          runTime,
          forceStringResult: true
        })

        return {
          content: result.result as string
        }
      } catch (err) {
        process.logger.error('err', err)
      }

      return {
        content: 'No webout returned.'
      }
    }

    return await getMockResponseFromFile([
      process.cwd(),
      'mocks',
      'sas9',
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

    if (this.isPublicAccount()) {
      return {
        content: '',
        redirect: '/SASLogon/Login'
      }
    }

    const program = req.query._program ?? req.body?._program
    const vars = {
      ...req.query,
      ...req.body,
      _requestMethod: req.method,
      _driveLoc: process.driveLoc
    }
    const filesNamesMap = req.files?.length
      ? makeFilesNamesMap(req.files as MulterFile[])
      : null
    const otherArgs = { filesNamesMap: filesNamesMap }
    const { codePath, runTime } = await getRunTimeAndFilePath(program + '.js')
    try {
      const result = await new ExecutionController().executeFile({
        programPath: codePath,
        preProgramVariables: getPreProgramVariables(req),
        vars: vars,
        otherArgs: otherArgs,
        runTime,
        session: req.sasjsSession,
        forceStringResult: true
      })

      return {
        content: result.result as string
      }
    } catch (err) {
      process.logger.error('err', err)
    }

    return {
      content: 'No webout returned.'
    }
  }

  @Get('/SASLogon/login')
  public async loginGet(): Promise<Sas9Response> {
    if (this.loggedIn) {
      if (this.isPublicAccount()) {
        return {
          content: '',
          redirect: '/SASStoredProcess/Logoff?publicDenied=true'
        }
      } else {
        return await getMockResponseFromFile([
          process.cwd(),
          'mocks',
          'sas9',
          'generic',
          'logged-in'
        ])
      }
    }

    return await getMockResponseFromFile([
      process.cwd(),
      'mocks',
      'sas9',
      'generic',
      'login'
    ])
  }

  @Post('/SASLogon/login')
  public async loginPost(req: express.Request): Promise<Sas9Response> {
    if (req.body.lt && req.body.lt !== 'validtoken')
      return {
        content: '',
        redirect: '/SASLogon/login'
      }

    this.loggedIn = req.body.username

    return await getMockResponseFromFile([
      process.cwd(),
      'mocks',
      'sas9',
      'generic',
      'logged-in'
    ])
  }

  @Get('/SASLogon/logout')
  public async logout(req: express.Request): Promise<Sas9Response> {
    this.loggedIn = undefined

    if (req.query.publicDenied === 'true') {
      return await getMockResponseFromFile([
        process.cwd(),
        'mocks',
        'sas9',
        'generic',
        'public-access-denied'
      ])
    }

    return await getMockResponseFromFile([
      process.cwd(),
      'mocks',
      'sas9',
      'generic',
      'logged-out'
    ])
  }

  @Get('/SASStoredProcess/Logoff') //publicDenied=true
  public async logoff(req: express.Request): Promise<Sas9Response> {
    const params = req.query.publicDenied
      ? `?publicDenied=${req.query.publicDenied}`
      : ''

    return {
      content: '',
      redirect: '/SASLogon/logout' + params
    }
  }

  private isPublicAccount = () => this.loggedIn?.toLowerCase() === 'public'
}

const getMockResponseFromFile = async (
  filePath: string[]
): Promise<MockFileRead> => {
  const filePathParsed = path.join(...filePath)
  let error: boolean = false

  let file = await readFile(filePathParsed).catch((err: any) => {
    const errMsg = `Error reading mocked file on path: ${filePathParsed}\nError: ${err}`
    process.logger.error(errMsg)

    error = true

    return errMsg
  })

  return {
    content: file,
    error: error
  }
}
