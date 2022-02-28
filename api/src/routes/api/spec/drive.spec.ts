import path from 'path'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'

import {
  folderExists,
  fileExists,
  readFile,
  deleteFolder,
  generateTimestamp,
  copy
} from '@sasjs/utils'
import * as fileUtilModules from '../../../utils/file'

const timestamp = generateTimestamp()
const tmpFolder = path.join(process.cwd(), `tmp-${timestamp}`)
jest
  .spyOn(fileUtilModules, 'getTmpFolderPath')
  .mockImplementation(() => tmpFolder)
jest
  .spyOn(fileUtilModules, 'getTmpUploadsPath')
  .mockImplementation(() => path.join(tmpFolder, 'uploads'))

import appPromise from '../../../app'
import { UserController } from '../../../controllers/'
import { getTreeExample } from '../../../controllers/internal'
import { FolderMember, ServiceMember } from '../../../types'
import { generateAccessToken, saveTokensInDB } from '../../../utils/'
const { getTmpFilesFolderPath } = fileUtilModules

let app: Express
appPromise.then((_app) => {
  app = _app
})

const clientId = 'someclientID'
const user = {
  displayName: 'Test User',
  username: 'testUsername',
  password: '87654321',
  isAdmin: false,
  isActive: true
}

describe('files', () => {
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const controller = new UserController()

  let accessToken: string

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    const dbUser = await controller.createUser(user)
    accessToken = generateAccessToken({
      clientId,
      userId: dbUser.id
    })
    await saveTokensInDB(dbUser.id, clientId, accessToken, 'refreshToken')
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
    await deleteFolder(tmpFolder)
  })
  describe('deploy', () => {
    const shouldFailAssertion = async (payload: any) => {
      const res = await request(app)
        .post('/SASjsApi/drive/deploy')
        .auth(accessToken, { type: 'bearer' })
        .send(payload)

      expect(res.statusCode).toEqual(400)
      expect(res.body).toEqual({
        status: 'failure',
        message: 'Provided not supported data format.',
        example: getTreeExample()
      })
    }

    it('should respond with payload example if valid payload was not provided', async () => {
      await shouldFailAssertion(null)
      await shouldFailAssertion(undefined)
      await shouldFailAssertion('data')
      await shouldFailAssertion({})
      await shouldFailAssertion({
        userId: 1,
        title: 'test is cool'
      })
      await shouldFailAssertion({
        membersWRONG: []
      })
      await shouldFailAssertion({
        members: {}
      })
      await shouldFailAssertion({
        members: [
          {
            nameWRONG: 'jobs',
            type: 'folder',
            members: []
          }
        ]
      })
      await shouldFailAssertion({
        members: [
          {
            name: 'jobs',
            type: 'WRONG',
            members: []
          }
        ]
      })
      await shouldFailAssertion({
        members: [
          {
            name: 'jobs',
            type: 'folder',
            members: [
              {
                name: 'extract',
                type: 'folder',
                members: [
                  {
                    name: 'makedata1',
                    type: 'service',
                    codeWRONG: '%put Hello World!;'
                  }
                ]
              }
            ]
          }
        ]
      })
    })

    it('should respond with payload example if valid payload was not provided', async () => {
      const res = await request(app)
        .post('/SASjsApi/drive/deploy')
        .auth(accessToken, { type: 'bearer' })
        .send({ fileTree: getTreeExample() })

      expect(res.statusCode).toEqual(200)
      expect(res.text).toEqual(
        '{"status":"success","message":"Files deployed successfully to @sasjs/server."}'
      )
      await expect(folderExists(getTmpFilesFolderPath())).resolves.toEqual(true)

      const testJobFolder = path.join(
        getTmpFilesFolderPath(),
        'jobs',
        'extract'
      )
      await expect(folderExists(testJobFolder)).resolves.toEqual(true)

      const exampleService = getExampleService()
      const testJobFile = path.join(testJobFolder, exampleService.name) + '.sas'

      await expect(fileExists(testJobFile)).resolves.toEqual(true)

      await expect(readFile(testJobFile)).resolves.toEqual(exampleService.code)

      await deleteFolder(getTmpFilesFolderPath())
    })
  })

  describe('file', () => {
    describe('create', () => {
      it('should create a SAS file on drive having filePath as form field', async () => {
        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', '/my/path/code.sas')
          .attach('file', path.join(__dirname, 'files', 'sample.sas'))

        expect(res.statusCode).toEqual(200)
        expect(res.body).toEqual({
          status: 'success'
        })
      })

      it('should create a SAS file on drive having _filePath as query param', async () => {
        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .query({ _filePath: '/my/path/code1.sas' })
          .attach('file', path.join(__dirname, 'files', 'sample.sas'))

        expect(res.statusCode).toEqual(200)
        expect(res.body).toEqual({
          status: 'success'
        })
      })

      it('should respond with Unauthorized if access token is not present', async () => {
        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .field('filePath', '/my/path/code.sas')
          .attach('file', path.join(__dirname, 'files', 'sample.sas'))
          .expect(401)

        expect(res.text).toEqual('Unauthorized')
        expect(res.body).toEqual({})
      })

      it('should respond with Forbidden if file is already present', async () => {
        const fileToAttachPath = path.join(__dirname, 'files', 'sample.sas')
        const pathToUpload = '/my/path/code.sas'

        const pathToCopy = path.join(
          fileUtilModules.getTmpFilesFolderPath(),
          pathToUpload
        )
        await copy(fileToAttachPath, pathToCopy)

        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .attach('file', fileToAttachPath)
          .expect(403)

        expect(res.text).toEqual('Error: File already exists.')
        expect(res.body).toEqual({})
      })

      it('should respond with Forbidden if filePath outside Drive', async () => {
        const fileToAttachPath = path.join(__dirname, 'files', 'sample.sas')
        const pathToUpload = '/../path/code.sas'

        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .attach('file', fileToAttachPath)
          .expect(403)

        expect(res.text).toEqual('Error: Cannot put file outside drive.')
        expect(res.body).toEqual({})
      })

      it('should respond with Bad Request if filePath is missing', async () => {
        const fileToAttachPath = path.join(__dirname, 'files', 'sample.sas')

        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .attach('file', fileToAttachPath)
          .expect(400)

        expect(res.text).toEqual(`"filePath" is required`)
        expect(res.body).toEqual({})
      })

      it("should respond with Bad Request if filePath doesn't has correct extension", async () => {
        const fileToAttachPath = path.join(__dirname, 'files', 'sample.sas')
        const pathToUpload = '/my/path/code.oth'

        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .attach('file', fileToAttachPath)
          .expect(400)

        expect(res.text).toEqual('Valid extensions for filePath: .sas')
        expect(res.body).toEqual({})
      })

      it('should respond with Bad Request if file is missing', async () => {
        const pathToUpload = '/my/path/code.sas'

        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .expect(400)

        expect(res.text).toEqual('"file" is not present.')
        expect(res.body).toEqual({})
      })

      it("should respond with Bad Request if attached file doesn't has correct extension", async () => {
        const fileToAttachPath = path.join(__dirname, 'files', 'sample.oth')
        const pathToUpload = '/my/path/code.sas'

        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .attach('file', fileToAttachPath)
          .expect(400)

        expect(res.text).toEqual(
          `File extension '.oth' not acceptable. Valid extension(s): .sas`
        )
        expect(res.body).toEqual({})
      })

      it('should respond with Bad Request if attached file exceeds file limit', async () => {
        const pathToUpload = '/my/path/code.sas'

        const attachedFile = Buffer.from('.'.repeat(20 * 1024 * 1024))

        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .attach('file', attachedFile, 'another.sas')
          .expect(400)

        expect(res.text).toEqual(
          'File size is over limit. File limit is: 10 MB'
        )
        expect(res.body).toEqual({})
      })
    })
  })
})

const getExampleService = (): ServiceMember =>
  ((getTreeExample().members[0] as FolderMember).members[0] as FolderMember)
    .members[0] as ServiceMember
