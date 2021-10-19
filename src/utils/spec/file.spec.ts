import { addSasExtensionIfNotFound } from '..'

describe('file utils', () => {
  it('should add extension if missing', async () => {
    expect(addSasExtensionIfNotFound('test')).toEqual('.sas')
    expect(addSasExtensionIfNotFound('test.test')).toEqual('.sas')
    expect(addSasExtensionIfNotFound('test.sas')).toEqual('')
    expect(addSasExtensionIfNotFound('test.test.test')).toEqual('.sas')
    expect(addSasExtensionIfNotFound('test.test.test.sas')).toEqual('')
  })
})
