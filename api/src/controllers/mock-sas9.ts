import { readFile } from '@sasjs/utils'
import express from 'express'
import { Request, Post, Get } from 'tsoa'
import { resolveMockResponsePath } from '../utils/resolveMockResponsePath'
import dotenv from 'dotenv'
import { ExecutionController } from './internal'
import {
  getPreProgramVariables,
  getRunTimeAndFilePath,
  makeFilesNamesMap,
  resolveMockPath
} from '../utils'
import { MulterFile } from '../types/Upload'
import { mergeTierPostVariables } from '../utils/tierPostVariables'

dotenv.config({ quiet: true })

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

  /** Where the mock's files are read from - see resolveMockPath. */
  private mockBase(): string {
    return resolveMockPath(this.mocksPath)
  }

  /** Mock POST eligibility only; this is not server authentication. */
  public postLoginRedirect(): string | undefined {
    if (!this.loggedIn) return '/SASLogon/login'
    if (this.isPublicAccount()) return '/SASLogon/Login'
    return undefined
  }

  @Get('/SASStoredProcess')
  public async sasStoredProcess(
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

    let program = req.query._program?.toString() || undefined
    const filePath: string[] = program
      ? program.replace('/', '').split('/')
      : ['generic', 'sas-stored-process']

    return await getMockResponseFromFile(this.mockBase(), filePath)
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

    return await getMockResponseFromFile(this.mockBase(), filePath)
  }

  @Post('/SASStoredProcess/do/')
  public async sasStoredProcessDoPost(
    @Request() req: express.Request
  ): Promise<Sas9Response> {
    const redirect = this.postLoginRedirect()
    if (redirect) return { content: '', redirect }

    const program = req.query._program ?? req.body?._program
    const vars = {
      ...mergeTierPostVariables(req.query, req.body, program),
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
        return await getMockResponseFromFile(this.mockBase(), [
          'generic',
          'logged-in'
        ])
      }
    }

    return await getMockResponseFromFile(this.mockBase(), ['generic', 'login'])
  }

  @Post('/SASLogon/login')
  public async loginPost(req: express.Request): Promise<Sas9Response> {
    if (
      (req.body?.lt && req.body.lt !== 'validtoken') ||
      typeof req.body?.username !== 'string'
    )
      return {
        content: '',
        redirect: '/SASLogon/login'
      }

    this.loggedIn = req.body.username

    return await getMockResponseFromFile(this.mockBase(), [
      'generic',
      'logged-in'
    ])
  }

  @Get('/SASLogon/logout')
  public async logout(req: express.Request): Promise<Sas9Response> {
    this.loggedIn = undefined

    if (req.query.publicDenied === 'true') {
      return await getMockResponseFromFile(this.mockBase(), [
        'generic',
        'public-access-denied'
      ])
    }

    return await getMockResponseFromFile(this.mockBase(), [
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
  mockBase: string,
  responsePath: string[]
): Promise<MockFileRead> => {
  let error: boolean = false

  let file = await resolveMockResponsePath(mockBase, responsePath)
    .then((resolved) => readFile(resolved))
    .catch((err: any) => {
      const errMsg = `Error reading mocked file\nError: ${err}`
      process.logger.error(errMsg)

      error = true

      return errMsg
    })

  return {
    content: file,
    error: error
  }
}
