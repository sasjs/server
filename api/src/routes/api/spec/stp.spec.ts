import path from 'path'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import {
  UserController,
  PermissionController,
  PermissionSetting,
  PrincipalType
} from '../../../controllers/'
import {
  generateAccessToken,
  saveTokensInDB,
  getFilesFolder,
  RunTimeType,
  generateUniqueFileName,
  getSessionsFolder
} from '../../../utils'
import { createFile, generateTimestamp, deleteFolder } from '@sasjs/utils'
import {
  SASSessionController,
  JSSessionController
} from '../../../controllers/internal'
import * as ProcessProgramModule from '../../../controllers/internal/processProgram'
import { Session } from '../../../types'

const clientId = 'someclientID'

const user = {
  displayName: 'Test User',
  username: 'testUsername',
  password: '87654321',
  isAdmin: false,
  isActive: true
}

const sampleSasProgram = '%put hello world!;'
const sampleJsProgram = `console.log('hello world!/')`

const filesFolder = getFilesFolder()

describe('stp', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let accessToken: string
  const userController = new UserController()
  const permissionController = new PermissionController()

  beforeAll(async () => {
    app = await appPromise
    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())
    const dbUser = await userController.createUser(user)
    accessToken = await generateAndSaveToken(dbUser.id)
    await permissionController.createPermission({
      uri: '/SASjsApi/stp/execute',
      principalType: PrincipalType.user,
      principalId: dbUser.id,
      setting: PermissionSetting.grant
    })
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  describe('execute', () => {
    const testFilesFolder = `test-stp-${generateTimestamp()}`

    describe('get', () => {
      describe('with runtime js', () => {
        const testFilesFolder = `test-stp-${generateTimestamp()}`

        beforeAll(() => {
          process.runTimes = [RunTimeType.JS]
        })

        beforeEach(() => {
          jest.resetModules() // it clears the cache
          setupMocks()
        })

        afterEach(async () => {
          jest.resetAllMocks()
          await deleteFolder(path.join(filesFolder, testFilesFolder))
        })

        it('should execute js program when both js and sas program are present', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          const jsProgramPath = path.join(filesFolder, `${programPath}.js`)
          await createFile(sasProgramPath, sampleSasProgram)
          await createFile(jsProgramPath, sampleJsProgram)

          await request(app)
            .get(`/SASjsApi/stp/execute?_program=${programPath}`)
            .auth(accessToken, { type: 'bearer' })
            .send()
            .expect(200)

          expect(ProcessProgramModule.processProgram).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            RunTimeType.JS,
            expect.anything(),
            undefined
          )
        })

        it('should throw error when js program is not present but sas program exists', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          await createFile(sasProgramPath, sampleSasProgram)

          await request(app)
            .get(`/SASjsApi/stp/execute?_program=${programPath}`)
            .auth(accessToken, { type: 'bearer' })
            .send()
            .expect(400)
        })
      })

      describe('with runtime sas', () => {
        beforeAll(() => {
          process.runTimes = [RunTimeType.SAS]
        })

        beforeEach(() => {
          jest.resetModules() // it clears the cache
          setupMocks()
        })

        afterEach(async () => {
          jest.resetAllMocks()
          await deleteFolder(path.join(filesFolder, testFilesFolder))
        })

        it('should execute sas program when both sas and js programs are present', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          const jsProgramPath = path.join(filesFolder, `${programPath}.js`)
          await createFile(sasProgramPath, sampleSasProgram)
          await createFile(jsProgramPath, sampleJsProgram)

          await request(app)
            .get(`/SASjsApi/stp/execute?_program=${programPath}`)
            .auth(accessToken, { type: 'bearer' })
            .send()
            .expect(200)

          expect(ProcessProgramModule.processProgram).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            RunTimeType.SAS,
            expect.anything(),
            undefined
          )
        })

        it('should throw error when sas program do not exit but js exists', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const jsProgramPath = path.join(filesFolder, `${programPath}.js`)
          await createFile(jsProgramPath, sampleJsProgram)

          await request(app)
            .get(`/SASjsApi/stp/execute?_program=${programPath}`)
            .auth(accessToken, { type: 'bearer' })
            .send()
            .expect(400)
        })
      })

      describe('with runtime js and sas', () => {
        beforeAll(() => {
          process.runTimes = [RunTimeType.JS, RunTimeType.SAS]
        })

        beforeEach(() => {
          jest.resetModules() // it clears the cache
          setupMocks()
        })

        afterEach(async () => {
          jest.resetAllMocks()
          await deleteFolder(path.join(filesFolder, testFilesFolder))
        })

        it('should execute js program when both js and sas program are present', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          const jsProgramPath = path.join(filesFolder, `${programPath}.js`)
          await createFile(sasProgramPath, sampleSasProgram)
          await createFile(jsProgramPath, sampleJsProgram)

          await request(app)
            .get(`/SASjsApi/stp/execute?_program=${programPath}`)
            .auth(accessToken, { type: 'bearer' })
            .send()
            .expect(200)

          expect(ProcessProgramModule.processProgram).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            RunTimeType.JS,
            expect.anything(),
            undefined
          )
        })

        it('should execute sas program when js program is not present but sas program exists', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          await createFile(sasProgramPath, sampleSasProgram)

          await request(app)
            .get(`/SASjsApi/stp/execute?_program=${programPath}`)
            .auth(accessToken, { type: 'bearer' })
            .send()
            .expect(200)

          expect(ProcessProgramModule.processProgram).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            RunTimeType.SAS,
            expect.anything(),
            undefined
          )
        })

        it('should throw error when both sas and js programs do not exist', async () => {
          const programPath = path.join(testFilesFolder, 'program')

          await request(app)
            .get(`/SASjsApi/stp/execute?_program=${programPath}`)
            .auth(accessToken, { type: 'bearer' })
            .send()
            .expect(400)
        })
      })

      describe('with runtime sas and js', () => {
        beforeAll(() => {
          process.runTimes = [RunTimeType.SAS, RunTimeType.JS]
        })

        beforeEach(() => {
          jest.resetModules() // it clears the cache
          setupMocks()
        })

        afterEach(async () => {
          jest.resetAllMocks()
          await deleteFolder(path.join(filesFolder, testFilesFolder))
        })

        it('should execute sas program when both sas and js programs  exist', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          const jsProgramPath = path.join(filesFolder, `${programPath}.js`)
          await createFile(sasProgramPath, sampleSasProgram)
          await createFile(jsProgramPath, sampleJsProgram)

          await request(app)
            .get(`/SASjsApi/stp/execute?_program=${programPath}`)
            .auth(accessToken, { type: 'bearer' })
            .send()
            .expect(200)

          expect(ProcessProgramModule.processProgram).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            RunTimeType.SAS,
            expect.anything(),
            undefined
          )
        })

        it('should execute js program when sas program is not present but js program exists', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const jsProgramPath = path.join(filesFolder, `${programPath}.js`)
          await createFile(jsProgramPath, sampleJsProgram)

          await request(app)
            .get(`/SASjsApi/stp/execute?_program=${programPath}`)
            .auth(accessToken, { type: 'bearer' })
            .send()
            .expect(200)

          expect(ProcessProgramModule.processProgram).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            RunTimeType.JS,
            expect.anything(),
            undefined
          )
        })

        it('should throw error when both sas and js programs do not exist', async () => {
          const programPath = path.join(testFilesFolder, 'program')

          await request(app)
            .get(`/SASjsApi/stp/execute?_program=${programPath}`)
            .auth(accessToken, { type: 'bearer' })
            .send()
            .expect(400)
        })
      })
    })
  })
})

const generateSaveTokenAndCreateUser = async (
  someUser: any
): Promise<string> => {
  const userController = new UserController()
  const dbUser = await userController.createUser(someUser)

  return generateAndSaveToken(dbUser.id)
}

const generateAndSaveToken = async (userId: number) => {
  const accessToken = generateAccessToken({
    clientId,
    userId
  })
  await saveTokensInDB(userId, clientId, accessToken, 'refreshToken')
  return accessToken
}

const setupMocks = async () => {
  jest
    .spyOn(SASSessionController.prototype, 'getSession')
    .mockImplementation(mockedGetSession)

  jest
    .spyOn(JSSessionController.prototype, 'getSession')
    .mockImplementation(mockedGetSession)

  jest
    .spyOn(ProcessProgramModule, 'processProgram')
    .mockImplementation(() => Promise.resolve())
}

const mockedGetSession = async () => {
  const sessionId = generateUniqueFileName(generateTimestamp())
  const sessionFolder = path.join(getSessionsFolder(), sessionId)

  const creationTimeStamp = sessionId.split('-').pop() as string
  // death time of session is 15 mins from creation
  const deathTimeStamp = (
    parseInt(creationTimeStamp) +
    15 * 60 * 1000 -
    1000
  ).toString()

  const session: Session = {
    id: sessionId,
    ready: true,
    inUse: true,
    consumed: false,
    completed: false,
    creationTimeStamp,
    deathTimeStamp,
    path: sessionFolder
  }

  return session
}
