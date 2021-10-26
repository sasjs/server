import request from 'supertest'
import app from '../../app'
import { getTreeExample } from '../../controllers/deploy'
import { getTmpFilesFolderPath } from '../../utils/file'
import { folderExists, fileExists, readFile, deleteFolder } from '@sasjs/utils'
import path from 'path'

describe('deploy', () => {
  const shouldFailAssertion = async (payload: any) => {
    const res = await request(app).post('/deploy').send(payload)

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
      .post('/deploy')
      .send({ fileTree: getTreeExample() })

    expect(res.statusCode).toEqual(200)
    expect(res.text).toEqual(
      '{"status":"success","message":"Files deployed successfully to @sasjs/server."}'
    )
    await expect(folderExists(getTmpFilesFolderPath())).resolves.toEqual(true)

    const testJobFolder = path.join(getTmpFilesFolderPath(), 'jobs', 'extract')
    await expect(folderExists(testJobFolder)).resolves.toEqual(true)

    const testJobFile = path.join(
      testJobFolder,
      getTreeExample().members[0].members[0].members[0].name
    )

    await expect(fileExists(testJobFile)).resolves.toEqual(true)

    await expect(readFile(testJobFile)).resolves.toEqual(
      getTreeExample().members[0].members[0].members[0].code
    )

    await deleteFolder(getTmpFilesFolderPath())
  })
})
