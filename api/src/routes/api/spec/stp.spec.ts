import path from 'path'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import {
  UserController,
  PermissionController,
  PermissionType,
  PermissionSettingForRoute,
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
  JSSessionController,
  PythonSessionController
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
const samplePyProgram = `print('hello world!/')`

const filesFolder = getFilesFolder()

let app: Express
let accessToken: string

describe('stp', () => {
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()
  const permissionController = new PermissionController()

  beforeAll(async () => {
    app = await appPromise
    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())
    const dbUser = await userController.createUser(user)
    accessToken = await generateAndSaveToken(dbUser.id)
    await permissionController.createPermission({
      path: '/SASjsApi/stp/execute',
      type: PermissionType.route,
      principalType: PrincipalType.user,
      principalId: dbUser.id,
      setting: PermissionSettingForRoute.grant
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

          await makeRequestAndAssert(programPath, 200, RunTimeType.JS)
        })

        it('should throw error when js program is not present but sas program exists', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          await createFile(sasProgramPath, sampleSasProgram)

          await makeRequestAndAssert(programPath, 400)
        })
      })

      describe('with runtime py', () => {
        const testFilesFolder = `test-stp-${generateTimestamp()}`

        beforeAll(() => {
          process.runTimes = [RunTimeType.PY]
        })

        beforeEach(() => {
          jest.resetModules() // it clears the cache
          setupMocks()
        })

        afterEach(async () => {
          jest.resetAllMocks()
          await deleteFolder(path.join(filesFolder, testFilesFolder))
        })

        it('should execute python program when python, js and sas programs are present', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          const jsProgramPath = path.join(filesFolder, `${programPath}.js`)
          const pyProgramPath = path.join(filesFolder, `${programPath}.py`)
          await createFile(sasProgramPath, sampleSasProgram)
          await createFile(jsProgramPath, sampleJsProgram)
          await createFile(pyProgramPath, samplePyProgram)

          await makeRequestAndAssert(programPath, 200, RunTimeType.PY)
        })

        it('should throw error when py program is not present but js or sas program exists', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          await createFile(sasProgramPath, sampleSasProgram)

          await makeRequestAndAssert(programPath, 400)
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

          await makeRequestAndAssert(programPath, 200, RunTimeType.SAS)
        })

        it('should throw error when sas program do not exit but js exists', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const jsProgramPath = path.join(filesFolder, `${programPath}.js`)
          await createFile(jsProgramPath, sampleJsProgram)

          await makeRequestAndAssert(programPath, 400)
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

          await makeRequestAndAssert(programPath, 200, RunTimeType.JS)
        })

        it('should execute sas program when js program is not present but sas program exists', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          await createFile(sasProgramPath, sampleSasProgram)

          await makeRequestAndAssert(programPath, 200, RunTimeType.SAS)
        })

        it('should throw error when both sas and js programs do not exist', async () => {
          const programPath = path.join(testFilesFolder, 'program')

          await makeRequestAndAssert(programPath, 400)
        })
      })

      describe('with runtime py and sas', () => {
        beforeAll(() => {
          process.runTimes = [RunTimeType.PY, RunTimeType.SAS]
        })

        beforeEach(() => {
          jest.resetModules() // it clears the cache
          setupMocks()
        })

        afterEach(async () => {
          jest.resetAllMocks()
          await deleteFolder(path.join(filesFolder, testFilesFolder))
        })

        it('should execute python program when both python and sas program are present', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          const pyProgramPath = path.join(filesFolder, `${programPath}.py`)
          await createFile(sasProgramPath, sampleSasProgram)
          await createFile(pyProgramPath, samplePyProgram)

          await makeRequestAndAssert(programPath, 200, RunTimeType.PY)
        })

        it('should execute sas program when python program is not present but sas program exists', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          await createFile(sasProgramPath, sampleSasProgram)

          await makeRequestAndAssert(programPath, 200, RunTimeType.SAS)
        })

        it('should throw error when both sas and js programs do not exist', async () => {
          const programPath = path.join(testFilesFolder, 'program')

          await makeRequestAndAssert(programPath, 400)
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

          await makeRequestAndAssert(programPath, 200, RunTimeType.SAS)
        })

        it('should execute js program when sas program is not present but js program exists', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const jsProgramPath = path.join(filesFolder, `${programPath}.js`)
          await createFile(jsProgramPath, sampleJsProgram)

          await makeRequestAndAssert(programPath, 200, RunTimeType.JS)
        })

        it('should throw error when both sas and js programs do not exist', async () => {
          const programPath = path.join(testFilesFolder, 'program')

          await makeRequestAndAssert(programPath, 400)
        })
      })

      describe('with runtime sas and py', () => {
        beforeAll(() => {
          process.runTimes = [RunTimeType.SAS, RunTimeType.PY]
        })

        beforeEach(() => {
          jest.resetModules() // it clears the cache
          setupMocks()
        })

        afterEach(async () => {
          jest.resetAllMocks()
          await deleteFolder(path.join(filesFolder, testFilesFolder))
        })

        it('should execute sas program when both sas and python programs exist', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          const pyProgramPath = path.join(filesFolder, `${programPath}.py`)
          await createFile(sasProgramPath, sampleSasProgram)
          await createFile(pyProgramPath, samplePyProgram)

          await makeRequestAndAssert(programPath, 200, RunTimeType.SAS)
        })

        it('should execute python program when sas program is not present but python program exists', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const pyProgramPath = path.join(filesFolder, `${programPath}.py`)
          await createFile(pyProgramPath, samplePyProgram)

          await makeRequestAndAssert(programPath, 200, RunTimeType.PY)
        })

        it('should throw error when both sas and python programs do not exist', async () => {
          const programPath = path.join(testFilesFolder, 'program')

          await makeRequestAndAssert(programPath, 400)
        })
      })

      describe('with runtime sas, js and py', () => {
        beforeAll(() => {
          process.runTimes = [RunTimeType.SAS, RunTimeType.JS, RunTimeType.PY]
        })

        beforeEach(() => {
          jest.resetModules() // it clears the cache
          setupMocks()
        })

        afterEach(async () => {
          jest.resetAllMocks()
          await deleteFolder(path.join(filesFolder, testFilesFolder))
        })

        it('should execute sas program when it exists, no matter js and python programs exist or not', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          const jsProgramPath = path.join(filesFolder, `${programPath}.js`)
          const pyProgramPath = path.join(filesFolder, `${programPath}.py`)
          await createFile(sasProgramPath, sampleSasProgram)
          await createFile(jsProgramPath, sampleJsProgram)
          await createFile(pyProgramPath, samplePyProgram)

          await makeRequestAndAssert(programPath, 200, RunTimeType.SAS)
        })

        it('should execute js program when sas program is absent but js and python programs are present', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const jsProgramPath = path.join(filesFolder, `${programPath}.js`)
          const pyProgramPath = path.join(filesFolder, `${programPath}.py`)
          await createFile(jsProgramPath, sampleJsProgram)
          await createFile(pyProgramPath, samplePyProgram)

          await makeRequestAndAssert(programPath, 200, RunTimeType.JS)
        })

        it('should execute python program when both sas and js programs are not present', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const pyProgramPath = path.join(filesFolder, `${programPath}.py`)
          await createFile(pyProgramPath, samplePyProgram)

          await makeRequestAndAssert(programPath, 200, RunTimeType.PY)
        })

        it('should throw error when no program exists', async () => {
          const programPath = path.join(testFilesFolder, 'program')

          await makeRequestAndAssert(programPath, 400)
        })
      })

      describe('with runtime js, sas and py', () => {
        beforeAll(() => {
          process.runTimes = [RunTimeType.JS, RunTimeType.SAS, RunTimeType.PY]
        })

        beforeEach(() => {
          jest.resetModules() // it clears the cache
          setupMocks()
        })

        afterEach(async () => {
          jest.resetAllMocks()
          await deleteFolder(path.join(filesFolder, testFilesFolder))
        })

        it('should execute js program when it exists, no matter sas and python programs exist or not', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const jsProgramPath = path.join(filesFolder, `${programPath}.js`)
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          const pyProgramPath = path.join(filesFolder, `${programPath}.py`)
          await createFile(jsProgramPath, sampleJsProgram)
          await createFile(sasProgramPath, sampleSasProgram)
          await createFile(pyProgramPath, samplePyProgram)

          await makeRequestAndAssert(programPath, 200, RunTimeType.JS)
        })

        it('should execute sas program when js program is absent but sas and python programs are present', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          const pyProgramPath = path.join(filesFolder, `${programPath}.py`)
          await createFile(sasProgramPath, sampleSasProgram)
          await createFile(pyProgramPath, samplePyProgram)

          await makeRequestAndAssert(programPath, 200, RunTimeType.SAS)
        })

        it('should execute python program when both sas and js programs are not present', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const pyProgramPath = path.join(filesFolder, `${programPath}.py`)
          await createFile(pyProgramPath, samplePyProgram)

          await makeRequestAndAssert(programPath, 200, RunTimeType.PY)
        })

        it('should throw error when no program exists', async () => {
          const programPath = path.join(testFilesFolder, 'program')

          await makeRequestAndAssert(programPath, 400)
        })
      })

      describe('with runtime py, sas and js', () => {
        beforeAll(() => {
          process.runTimes = [RunTimeType.PY, RunTimeType.SAS, RunTimeType.JS]
        })

        beforeEach(() => {
          jest.resetModules() // it clears the cache
          setupMocks()
        })

        afterEach(async () => {
          jest.resetAllMocks()
          await deleteFolder(path.join(filesFolder, testFilesFolder))
        })

        it('should execute python program when it exists, no matter sas and js programs exist or not', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const pyProgramPath = path.join(filesFolder, `${programPath}.py`)
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          const jsProgramPath = path.join(filesFolder, `${programPath}.js`)
          await createFile(pyProgramPath, samplePyProgram)
          await createFile(jsProgramPath, sampleJsProgram)
          await createFile(sasProgramPath, sampleSasProgram)

          await makeRequestAndAssert(programPath, 200, RunTimeType.PY)
        })

        it('should execute sas program when python program is absent but sas and js programs are present', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const sasProgramPath = path.join(filesFolder, `${programPath}.sas`)
          const jsProgramPath = path.join(filesFolder, `${programPath}.js`)
          await createFile(sasProgramPath, sampleSasProgram)
          await createFile(jsProgramPath, sampleJsProgram)

          await makeRequestAndAssert(programPath, 200, RunTimeType.SAS)
        })

        it('should execute js program when both sas and python programs are not present', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          const jsProgramPath = path.join(filesFolder, `${programPath}.js`)
          await createFile(jsProgramPath, sampleJsProgram)

          await makeRequestAndAssert(programPath, 200, RunTimeType.JS)
        })

        it('should throw error when no program exists', async () => {
          const programPath = path.join(testFilesFolder, 'program')
          await makeRequestAndAssert(programPath, 400)
        })
      })
    })
  })
})

const makeRequestAndAssert = async (
  programPath: string,
  expectedStatusCode: number,
  expectedRuntime?: RunTimeType
) => {
  await request(app)
    .get(`/SASjsApi/stp/execute?_program=${programPath}`)
    .auth(accessToken, { type: 'bearer' })
    .send()
    .expect(expectedStatusCode)

  if (expectedRuntime)
    expect(ProcessProgramModule.processProgram).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expectedRuntime,
      expect.anything(),
      undefined
    )
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
    .spyOn(PythonSessionController.prototype, 'getSession')
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
