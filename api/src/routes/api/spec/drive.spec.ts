import path from 'path'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import AdmZip from 'adm-zip'

import {
  folderExists,
  fileExists,
  readFile,
  deleteFolder,
  generateTimestamp,
  copy,
  createFolder,
  createFile,
  ServiceMember,
  FolderMember
} from '@sasjs/utils'
import * as fileUtilModules from '../../../utils/file'

const timestamp = generateTimestamp()
const tmpFolder = path.join(process.cwd(), `tmp-${timestamp}`)
jest
  .spyOn(fileUtilModules, 'getSasjsRootFolder')
  .mockImplementation(() => tmpFolder)
jest
  .spyOn(fileUtilModules, 'getUploadsFolder')
  .mockImplementation(() => path.join(tmpFolder, 'uploads'))

import appPromise from '../../../app'
import {
  UserController,
  PermissionController,
  PermissionType,
  PermissionSettingForRoute,
  PrincipalType
} from '../../../controllers/'
import { getTreeExample } from '../../../controllers/internal'
import { generateAccessToken, saveTokensInDB } from '../../../utils/'
const { getFilesFolder } = fileUtilModules

const clientId = 'someclientID'
const user = {
  displayName: 'Test User',
  username: 'testUsername',
  password: '87654321',
  isAdmin: false,
  isActive: true
}

const permission = {
  type: PermissionType.route,
  principalType: PrincipalType.user,
  setting: PermissionSettingForRoute.grant
}

describe('drive', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const controller = new UserController()
  const permissionController = new PermissionController()

  let accessToken: string

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    const dbUser = await controller.createUser(user)
    accessToken = await generateAndSaveToken(dbUser.id)
    await permissionController.createPermission({
      ...permission,
      path: '/SASjsApi/drive/deploy',
      principalId: dbUser.id
    })
    await permissionController.createPermission({
      ...permission,
      path: '/SASjsApi/drive/deploy/upload',
      principalId: dbUser.id
    })
    await permissionController.createPermission({
      ...permission,
      path: '/SASjsApi/drive/file',
      principalId: dbUser.id
    })
    await permissionController.createPermission({
      ...permission,
      path: '/SASjsApi/drive/folder',
      principalId: dbUser.id
    })
    await permissionController.createPermission({
      ...permission,
      path: '/SASjsApi/drive/rename',
      principalId: dbUser.id
    })
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
    await deleteFolder(tmpFolder)
  })

  describe('deploy', () => {
    const makeRequest = async (payload: any, type: string = 'payload') => {
      const requestUrl =
        type === 'payload'
          ? '/SASjsApi/drive/deploy'
          : '/SASjsApi/drive/deploy/upload'

      if (type === 'payload') {
        return await request(app)
          .post(requestUrl)
          .auth(accessToken, { type: 'bearer' })
          .send({ appLoc: '/Public', fileTree: payload })
      }
      if (type === 'file') {
        const deployContents = JSON.stringify({
          appLoc: '/Public',
          fileTree: payload
        })
        return await request(app)
          .post(requestUrl)
          .auth(accessToken, { type: 'bearer' })
          .attach('file', Buffer.from(deployContents), 'deploy.json')
      } else {
        const deployContents = JSON.stringify({
          appLoc: '/Public',
          fileTree: payload
        })
        const zip = new AdmZip()
        // add file directly
        zip.addFile(
          'deploy.json',
          Buffer.from(deployContents, 'utf8'),
          'entry comment goes here'
        )

        return await request(app)
          .post(requestUrl)
          .auth(accessToken, { type: 'bearer' })
          .attach('file', zip.toBuffer(), 'deploy.json.zip')
      }
    }

    const shouldFailAssertion = async (
      payload: any,
      type: string = 'payload'
    ) => {
      const res = await makeRequest(payload, type)

      expect(res.statusCode).toEqual(400)

      if (payload === undefined) {
        expect(res.text).toEqual('"fileTree" is required')
      } else {
        expect(res.body).toEqual({
          status: 'failure',
          message: 'Provided not supported data format.',
          example: getTreeExample()
        })
      }
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

    it('should successfully deploy if valid payload was provided', async () => {
      const res = await request(app)
        .post('/SASjsApi/drive/deploy')
        .auth(accessToken, { type: 'bearer' })
        .send({ appLoc: '/public', fileTree: getTreeExample() })

      expect(res.statusCode).toEqual(200)
      expect(res.text).toEqual(
        '{"status":"success","message":"Files deployed successfully to @sasjs/server."}'
      )
      await expect(folderExists(getFilesFolder())).resolves.toEqual(true)

      const testJobFolder = path.join(
        getFilesFolder(),
        'public',
        'jobs',
        'extract'
      )
      await expect(folderExists(testJobFolder)).resolves.toEqual(true)

      const exampleService = getExampleService()
      const testJobFile = path.join(testJobFolder, exampleService.name) + '.sas'

      await expect(fileExists(testJobFile)).resolves.toEqual(true)

      await expect(readFile(testJobFile)).resolves.toEqual(exampleService.code)

      await deleteFolder(path.join(getFilesFolder(), 'public'))
    })

    describe('upload', () => {
      it('should respond with payload example if valid JSON file was not provided', async () => {
        await shouldFailAssertion(null, 'file')
        await shouldFailAssertion(undefined, 'file')
        await shouldFailAssertion('data', 'file')
        await shouldFailAssertion({}, 'file')
        await shouldFailAssertion(
          {
            userId: 1,
            title: 'test is cool'
          },
          'file'
        )
        await shouldFailAssertion(
          {
            membersWRONG: []
          },
          'file'
        )
        await shouldFailAssertion(
          {
            members: {}
          },
          'file'
        )
        await shouldFailAssertion(
          {
            members: [
              {
                nameWRONG: 'jobs',
                type: 'folder',
                members: []
              }
            ]
          },
          'file'
        )
        await shouldFailAssertion(
          {
            members: [
              {
                name: 'jobs',
                type: 'WRONG',
                members: []
              }
            ]
          },
          'file'
        )
        await shouldFailAssertion(
          {
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
          },
          'file'
        )
      })

      it('should successfully deploy if valid JSON file was provided', async () => {
        const deployContents = JSON.stringify({
          appLoc: '/public',
          fileTree: getTreeExample()
        })
        const res = await request(app)
          .post('/SASjsApi/drive/deploy/upload')
          .auth(accessToken, { type: 'bearer' })
          .attach('file', Buffer.from(deployContents), 'deploy.json')

        expect(res.statusCode).toEqual(200)
        expect(res.text).toEqual(
          '{"status":"success","message":"Files deployed successfully to @sasjs/server."}'
        )
        await expect(folderExists(getFilesFolder())).resolves.toEqual(true)

        const testJobFolder = path.join(
          getFilesFolder(),
          'public',
          'jobs',
          'extract'
        )
        await expect(folderExists(testJobFolder)).resolves.toEqual(true)

        const exampleService = getExampleService()
        const testJobFile =
          path.join(testJobFolder, exampleService.name) + '.sas'

        await expect(fileExists(testJobFile)).resolves.toEqual(true)

        await expect(readFile(testJobFile)).resolves.toEqual(
          exampleService.code
        )

        await deleteFolder(path.join(getFilesFolder(), 'public'))
      })
    })

    describe('upload - zipped', () => {
      it('should respond with payload example if valid Zipped file was not provided', async () => {
        await shouldFailAssertion(null, 'zip')
        await shouldFailAssertion(undefined, 'zip')
        await shouldFailAssertion('data', 'zip')
        await shouldFailAssertion({}, 'zip')
        await shouldFailAssertion(
          {
            userId: 1,
            title: 'test is cool'
          },
          'zip'
        )
        await shouldFailAssertion(
          {
            membersWRONG: []
          },
          'zip'
        )
        await shouldFailAssertion(
          {
            members: {}
          },
          'zip'
        )
        await shouldFailAssertion(
          {
            members: [
              {
                nameWRONG: 'jobs',
                type: 'folder',
                members: []
              }
            ]
          },
          'zip'
        )
        await shouldFailAssertion(
          {
            members: [
              {
                name: 'jobs',
                type: 'WRONG',
                members: []
              }
            ]
          },
          'zip'
        )
        await shouldFailAssertion(
          {
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
          },
          'zip'
        )
      })

      it('should successfully deploy if valid Zipped file was provided', async () => {
        const deployContents = JSON.stringify({
          appLoc: '/public',
          fileTree: getTreeExample()
        })

        const zip = new AdmZip()
        // add file directly
        zip.addFile(
          'deploy.json',
          Buffer.from(deployContents, 'utf8'),
          'entry comment goes here'
        )
        const res = await request(app)
          .post('/SASjsApi/drive/deploy/upload')
          .auth(accessToken, { type: 'bearer' })
          .attach('file', zip.toBuffer(), 'deploy.json.zip')

        expect(res.statusCode).toEqual(200)
        expect(res.text).toEqual(
          '{"status":"success","message":"Files deployed successfully to @sasjs/server."}'
        )
        await expect(folderExists(getFilesFolder())).resolves.toEqual(true)

        const testJobFolder = path.join(
          getFilesFolder(),
          'public',
          'jobs',
          'extract'
        )
        await expect(folderExists(testJobFolder)).resolves.toEqual(true)

        const exampleService = getExampleService()
        const testJobFile =
          path.join(testJobFolder, exampleService.name) + '.sas'

        await expect(fileExists(testJobFile)).resolves.toEqual(true)

        await expect(readFile(testJobFile)).resolves.toEqual(
          exampleService.code
        )

        await deleteFolder(path.join(getFilesFolder(), 'public'))
      })
    })
  })

  describe('folder', () => {
    describe('get', () => {
      const getFolderApi = '/SASjsApi/drive/folder'

      it('should get root SAS folder on drive', async () => {
        const res = await request(app)
          .get(getFolderApi)
          .auth(accessToken, { type: 'bearer' })

        expect(res.statusCode).toEqual(200)
        expect(res.body).toEqual({ files: [], folders: [] })
      })

      it('should get a SAS folder on drive having _folderPath as query param', async () => {
        const pathToDrive = fileUtilModules.getFilesFolder()

        const dirLevel1 = 'level1'
        const dirLevel2 = 'level2'
        const fileLevel1 = 'file1'
        const fileLevel2 = 'file2'

        await createFolder(path.join(pathToDrive, dirLevel1, dirLevel2))
        await createFile(
          path.join(pathToDrive, dirLevel1, fileLevel1),
          'some file content'
        )
        await createFile(
          path.join(pathToDrive, dirLevel1, dirLevel2, fileLevel2),
          'some file content'
        )

        const res1 = await request(app)
          .get(getFolderApi)
          .query({ _folderPath: '/' })
          .auth(accessToken, { type: 'bearer' })

        expect(res1.statusCode).toEqual(200)
        expect(res1.body).toEqual({ files: [], folders: [dirLevel1] })

        const res2 = await request(app)
          .get(getFolderApi)
          .query({ _folderPath: dirLevel1 })
          .auth(accessToken, { type: 'bearer' })

        expect(res2.statusCode).toEqual(200)
        expect(res2.body).toEqual({ files: [fileLevel1], folders: [dirLevel2] })

        const res3 = await request(app)
          .get(getFolderApi)
          .query({ _folderPath: `${dirLevel1}/${dirLevel2}` })
          .auth(accessToken, { type: 'bearer' })

        expect(res3.statusCode).toEqual(200)
        expect(res3.body).toEqual({ files: [fileLevel2], folders: [] })
      })

      it('should respond with Unauthorized if access token is not present', async () => {
        const res = await request(app).get(getFolderApi).expect(401)

        expect(res.text).toEqual('Unauthorized')
        expect(res.body).toEqual({})
      })

      it('should respond with Not Found if folder is not present', async () => {
        const res = await request(app)
          .get(getFolderApi)
          .auth(accessToken, { type: 'bearer' })
          .query({ _folderPath: `/my/path/code-${generateTimestamp()}` })
          .expect(404)

        expect(res.text).toEqual(`Folder doesn't exist.`)
        expect(res.body).toEqual({})
      })

      it('should respond with Bad Request if folderPath outside Drive', async () => {
        const res = await request(app)
          .get(getFolderApi)
          .auth(accessToken, { type: 'bearer' })
          .query({ _folderPath: '/../path/code.sas' })
          .expect(400)

        expect(res.text).toEqual(`Can't get folder outside drive.`)
        expect(res.body).toEqual({})
      })

      it('should respond with Bad Request if folderPath is of a file', async () => {
        const fileToCopyPath = path.join(__dirname, 'files', 'sample.sas')
        const filePath = '/my/path/code.sas'

        const pathToCopy = path.join(fileUtilModules.getFilesFolder(), filePath)
        await copy(fileToCopyPath, pathToCopy)

        const res = await request(app)
          .get(getFolderApi)
          .auth(accessToken, { type: 'bearer' })
          .query({ _folderPath: filePath })
          .expect(400)

        expect(res.text).toEqual('Not a Folder.')
        expect(res.body).toEqual({})
      })
    })

    describe('post', () => {
      const folderApi = '/SASjsApi/drive/folder'
      const pathToDrive = fileUtilModules.getFilesFolder()

      afterEach(async () => {
        await deleteFolder(path.join(pathToDrive, 'post'))
      })

      it('should create a folder on drive', async () => {
        const res = await request(app)
          .post(folderApi)
          .auth(accessToken, { type: 'bearer' })
          .send({ folderPath: '/post/folder' })

        expect(res.statusCode).toEqual(200)
        expect(res.body).toEqual({
          status: 'success'
        })
      })

      it('should respond with Conflict if the folder already exists', async () => {
        await createFolder(path.join(pathToDrive, '/post/folder'))

        const res = await request(app)
          .post(folderApi)
          .auth(accessToken, { type: 'bearer' })
          .send({ folderPath: '/post/folder' })
          .expect(409)

        expect(res.text).toEqual(`Folder already exists.`)

        expect(res.statusCode).toEqual(409)
      })

      it('should respond with Bad Request if the folderPath is outside drive', async () => {
        const res = await request(app)
          .post(folderApi)
          .auth(accessToken, { type: 'bearer' })
          .send({ folderPath: '../sample' })
          .expect(400)

        expect(res.text).toEqual(`Can't put folder outside drive.`)
      })
    })

    describe('delete', () => {
      const folderApi = '/SASjsApi/drive/folder'
      const pathToDrive = fileUtilModules.getFilesFolder()

      it('should delete a folder on drive', async () => {
        await createFolder(path.join(pathToDrive, 'delete'))

        const res = await request(app)
          .delete(folderApi)
          .auth(accessToken, { type: 'bearer' })
          .query({ _folderPath: 'delete' })

        expect(res.statusCode).toEqual(200)
        expect(res.body).toEqual({
          status: 'success'
        })
      })

      it('should respond with Not Found if the folder does not  exists', async () => {
        const res = await request(app)
          .delete(folderApi)
          .auth(accessToken, { type: 'bearer' })
          .query({ _folderPath: 'notExists' })
          .expect(404)

        expect(res.text).toEqual(`Folder doesn't exist.`)
      })

      it('should respond with Bad Request if the folderPath is outside drive', async () => {
        const res = await request(app)
          .delete(folderApi)
          .auth(accessToken, { type: 'bearer' })
          .query({ _folderPath: '../outsideDrive' })
          .expect(400)

        expect(res.text).toEqual(`Can't delete folder outside drive.`)
      })
    })
  })

  describe('file', () => {
    describe('create', () => {
      it('should create a SAS file on drive having filePath as form field', async () => {
        const pathToUpload = `/my/path/code-1.sas`

        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .attach('file', path.join(__dirname, 'files', 'sample.sas'))

        expect(res.statusCode).toEqual(200)
        expect(res.body).toEqual({
          status: 'success'
        })
      })

      it('should create a SAS file on drive having _filePath as query param', async () => {
        const pathToUpload = `/my/path/code-2.sas`

        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .query({ _filePath: pathToUpload })
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

      it('should respond with Conflict if file is already present', async () => {
        const fileToAttachPath = path.join(__dirname, 'files', 'sample.sas')
        const pathToUpload = `/my/path/code-${generateTimestamp()}.sas`

        const pathToCopy = path.join(
          fileUtilModules.getFilesFolder(),
          pathToUpload
        )
        await copy(fileToAttachPath, pathToCopy)

        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .attach('file', fileToAttachPath)
          .expect(409)

        expect(res.text).toEqual('File already exists.')
        expect(res.body).toEqual({})
      })

      it('should respond with Bad Request if filePath outside Drive', async () => {
        const fileToAttachPath = path.join(__dirname, 'files', 'sample.sas')
        const pathToUpload = '/../path/code.sas'

        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .attach('file', fileToAttachPath)
          .expect(400)

        expect(res.text).toEqual(`Can't put file outside drive.`)
        expect(res.body).toEqual({})
      })

      it('should respond with Bad Request if filePath is missing', async () => {
        const fileToAttachPath = path.join(__dirname, 'files', 'sample.sas')

        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .attach('file', fileToAttachPath)
          .expect(400)

        expect(res.text).toEqual(`"_filePath" is required`)
        expect(res.body).toEqual({})
      })

      it("should respond with Bad Request if filePath doesn't has correct extension", async () => {
        const fileToAttachPath = path.join(__dirname, 'files', 'sample.sas')
        const pathToUpload = '/my/path/code.exe'

        const res = await request(app)
          .post(`/SASjsApi/drive/file?_filePath=${pathToUpload}`)
          .auth(accessToken, { type: 'bearer' })
          // .field('filePath', pathToUpload)
          .attach('file', fileToAttachPath)
          .expect(400)

        expect(res.text).toEqual('Invalid file extension')
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
        const fileToAttachPath = path.join(__dirname, 'files', 'sample.exe')
        const pathToUpload = '/my/path/code.sas'

        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .attach('file', fileToAttachPath)
          .expect(400)

        expect(res.text).toEqual(`File extension '.exe' not acceptable.`)
        expect(res.body).toEqual({})
      })

      it('should respond with Bad Request if attached file exceeds file limit', async () => {
        const pathToUpload = '/my/path/code.sas'

        const attachedFile = Buffer.from('.'.repeat(110 * 1024 * 1024)) // 110mb

        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .attach('file', attachedFile, 'another.sas')
          .expect(400)

        expect(res.text).toEqual(
          'File size is over limit. File limit is: 100 MB'
        )
        expect(res.body).toEqual({})
      })
    })

    describe('update', () => {
      it('should update a SAS file on drive having filePath as form field', async () => {
        const fileToAttachPath = path.join(__dirname, 'files', 'sample.sas')
        const pathToUpload = '/my/path/code.sas'

        const pathToCopy = path.join(
          fileUtilModules.getFilesFolder(),
          pathToUpload
        )
        await copy(fileToAttachPath, pathToCopy)

        const res = await request(app)
          .patch('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .attach('file', fileToAttachPath)

        expect(res.statusCode).toEqual(200)
        expect(res.body).toEqual({
          status: 'success'
        })
      })

      it('should update a SAS file on drive having _filePath as query param', async () => {
        const fileToAttachPath = path.join(__dirname, 'files', 'sample.sas')
        const pathToUpload = '/my/path/code.sas'

        const pathToCopy = path.join(
          fileUtilModules.getFilesFolder(),
          pathToUpload
        )
        await copy(fileToAttachPath, pathToCopy)

        const res = await request(app)
          .patch('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .attach('file', fileToAttachPath)

        expect(res.statusCode).toEqual(200)
        expect(res.body).toEqual({
          status: 'success'
        })
      })

      it('should respond with Unauthorized if access token is not present', async () => {
        const res = await request(app)
          .patch('/SASjsApi/drive/file')
          .field('filePath', '/my/path/code.sas')
          .attach('file', path.join(__dirname, 'files', 'sample.sas'))
          .expect(401)

        expect(res.text).toEqual('Unauthorized')
        expect(res.body).toEqual({})
      })

      it('should respond with Not Found if file is not present', async () => {
        const res = await request(app)
          .patch('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', `/my/path/code-3.sas`)
          .attach('file', path.join(__dirname, 'files', 'sample.sas'))
          .expect(404)

        expect(res.text).toEqual(`File doesn't exist.`)
        expect(res.body).toEqual({})
      })

      it('should respond with Bad Request if filePath outside Drive', async () => {
        const fileToAttachPath = path.join(__dirname, 'files', 'sample.sas')
        const pathToUpload = '/../path/code.sas'

        const res = await request(app)
          .patch('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .attach('file', fileToAttachPath)
          .expect(400)

        expect(res.text).toEqual(`Can't modify file outside drive.`)
        expect(res.body).toEqual({})
      })

      it('should respond with Bad Request if filePath is missing', async () => {
        const fileToAttachPath = path.join(__dirname, 'files', 'sample.sas')

        const res = await request(app)
          .patch('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .attach('file', fileToAttachPath)
          .expect(400)

        expect(res.text).toEqual(`"_filePath" is required`)
        expect(res.body).toEqual({})
      })

      it("should respond with Bad Request if filePath doesn't has correct extension", async () => {
        const fileToAttachPath = path.join(__dirname, 'files', 'sample.sas')
        const pathToUpload = '/my/path/code.exe'

        const res = await request(app)
          .patch('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .query({ _filePath: pathToUpload })
          .attach('file', fileToAttachPath)
          .expect(400)

        expect(res.text).toEqual('Invalid file extension')
        expect(res.body).toEqual({})
      })

      it('should respond with Bad Request if file is missing', async () => {
        const pathToUpload = '/my/path/code.sas'

        const res = await request(app)
          .patch('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .expect(400)

        expect(res.text).toEqual('"file" is not present.')
        expect(res.body).toEqual({})
      })

      it("should respond with Bad Request if attached file doesn't has correct extension", async () => {
        const fileToAttachPath = path.join(__dirname, 'files', 'sample.exe')
        const pathToUpload = '/my/path/code.sas'

        const res = await request(app)
          .patch('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .attach('file', fileToAttachPath)
          .expect(400)

        expect(res.text).toEqual(`File extension '.exe' not acceptable.`)
        expect(res.body).toEqual({})
      })

      it('should respond with Bad Request if attached file exceeds file limit', async () => {
        const pathToUpload = '/my/path/code.sas'

        const attachedFile = Buffer.from('.'.repeat(110 * 1024 * 1024)) // 110mb

        const res = await request(app)
          .patch('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .field('filePath', pathToUpload)
          .attach('file', attachedFile, 'another.sas')
          .expect(400)

        expect(res.text).toEqual(
          'File size is over limit. File limit is: 100 MB'
        )
        expect(res.body).toEqual({})
      })
    })

    describe('get', () => {
      it('should get a SAS file on drive having _filePath as query param', async () => {
        const fileToCopyPath = path.join(__dirname, 'files', 'sample.sas')
        const fileToCopyContent = await readFile(fileToCopyPath)
        const filePath = '/my/path/code.sas'

        const pathToCopy = path.join(fileUtilModules.getFilesFolder(), filePath)
        await copy(fileToCopyPath, pathToCopy)

        const res = await request(app)
          .get('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .query({ _filePath: filePath })

        expect(res.statusCode).toEqual(200)
        expect(res.body).toEqual({})
        expect(res.text).toEqual(fileToCopyContent)
      })

      it('should respond with Unauthorized if access token is not present', async () => {
        const res = await request(app).get('/SASjsApi/drive/file').expect(401)

        expect(res.text).toEqual('Unauthorized')
        expect(res.body).toEqual({})
      })

      it('should respond with Not Found if file is not present', async () => {
        const res = await request(app)
          .get('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .query({ _filePath: `/my/path/code-4.sas` })
          .expect(404)

        expect(res.text).toEqual(`File doesn't exist.`)
        expect(res.body).toEqual({})
      })

      it('should respond with Bad Request if filePath outside Drive', async () => {
        const res = await request(app)
          .get('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .query({ _filePath: '/../path/code.sas' })
          .expect(400)

        expect(res.text).toEqual(`Can't get file outside drive.`)
        expect(res.body).toEqual({})
      })

      it("should respond with Bad Request if filePath doesn't has correct extension", async () => {
        const res = await request(app)
          .patch('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .query({ _filePath: '/my/path/code.exe' })
          .expect(400)

        expect(res.text).toEqual('Invalid file extension')
        expect(res.body).toEqual({})
      })

      it('should respond with Bad Request if filePath is missing', async () => {
        const res = await request(app)
          .post('/SASjsApi/drive/file')
          .auth(accessToken, { type: 'bearer' })
          .expect(400)

        expect(res.text).toEqual(`"_filePath" is required`)
        expect(res.body).toEqual({})
      })
    })
  })

  describe('rename', () => {
    const renameApi = '/SASjsApi/drive/rename'
    const pathToDrive = fileUtilModules.getFilesFolder()

    afterEach(async () => {
      await deleteFolder(path.join(pathToDrive, 'rename'))
    })

    it('should rename a folder', async () => {
      await createFolder(path.join(pathToDrive, 'rename', 'folder'))

      const res = await request(app)
        .post(renameApi)
        .auth(accessToken, { type: 'bearer' })
        .send({ oldPath: '/rename/folder', newPath: '/rename/renamed' })

      expect(res.statusCode).toEqual(200)
      expect(res.body).toEqual({
        status: 'success'
      })
    })

    it('should rename a file', async () => {
      await createFile(
        path.join(pathToDrive, 'rename', 'file.txt'),
        'some file content'
      )

      const res = await request(app)
        .post(renameApi)
        .auth(accessToken, { type: 'bearer' })
        .send({
          oldPath: '/rename/file.txt',
          newPath: '/rename/renamed.txt'
        })

      expect(res.statusCode).toEqual(200)
      expect(res.body).toEqual({
        status: 'success'
      })
    })

    it('should respond with Bad Request if the oldPath is missing', async () => {
      const res = await request(app)
        .post(renameApi)
        .auth(accessToken, { type: 'bearer' })
        .send({ newPath: 'newPath' })
        .expect(400)

      expect(res.text).toEqual(`\"oldPath\" is required`)
    })

    it('should respond with Bad Request if the newPath is missing', async () => {
      const res = await request(app)
        .post(renameApi)
        .auth(accessToken, { type: 'bearer' })
        .send({ oldPath: 'oldPath' })
        .expect(400)

      expect(res.text).toEqual(`\"newPath\" is required`)
    })

    it('should respond with Bad Request if the oldPath is outside drive', async () => {
      const res = await request(app)
        .post(renameApi)
        .auth(accessToken, { type: 'bearer' })
        .send({ oldPath: '../outside', newPath: 'renamed' })
        .expect(400)

      expect(res.text).toEqual(`Old path can't be outside of drive.`)
    })

    it('should respond with Bad Request if the newPath is outside drive', async () => {
      const res = await request(app)
        .post(renameApi)
        .auth(accessToken, { type: 'bearer' })
        .send({ oldPath: 'older', newPath: '../outside' })
        .expect(400)

      expect(res.text).toEqual(`New path can't be outside of drive.`)
    })

    it('should respond with Not Found if the folder does not exist', async () => {
      const res = await request(app)
        .post(renameApi)
        .auth(accessToken, { type: 'bearer' })
        .send({ oldPath: '/rename/not exists', newPath: '/rename/renamed' })
        .expect(404)

      expect(res.text).toEqual('No file/folder found for provided path.')
    })

    it('should respond with Conflict if the folder already exists', async () => {
      await createFolder(path.join(pathToDrive, 'rename', 'folder'))
      await createFolder(path.join(pathToDrive, 'rename', 'exists'))
      const res = await request(app)
        .post(renameApi)
        .auth(accessToken, { type: 'bearer' })
        .send({ oldPath: '/rename/folder', newPath: '/rename/exists' })
        .expect(409)

      expect(res.text).toEqual('Folder with new name already exists.')
    })

    it('should respond with Not Found if the file does not exist', async () => {
      const res = await request(app)
        .post(renameApi)
        .auth(accessToken, { type: 'bearer' })
        .send({ oldPath: '/rename/file.txt', newPath: '/rename/renamed.txt' })
        .expect(404)

      expect(res.text).toEqual('No file/folder found for provided path.')
    })

    it('should respond with Conflict if the file already exists', async () => {
      await createFile(
        path.join(pathToDrive, 'rename', 'file.txt'),
        'some file content'
      )
      await createFile(
        path.join(pathToDrive, 'rename', 'exists.txt'),
        'some existing content'
      )
      const res = await request(app)
        .post(renameApi)
        .auth(accessToken, { type: 'bearer' })
        .send({ oldPath: '/rename/file.txt', newPath: '/rename/exists.txt' })
        .expect(409)

      expect(res.text).toEqual('File with new name already exists.')
    })
  })
})

const getExampleService = (): ServiceMember =>
  ((getTreeExample().members[0] as FolderMember).members[0] as FolderMember)
    .members[0] as ServiceMember

const generateAndSaveToken = async (userId: number) => {
  const adminAccessToken = generateAccessToken({
    clientId,
    userId
  })
  await saveTokensInDB(userId, clientId, adminAccessToken, 'refreshToken')
  return adminAccessToken
}
