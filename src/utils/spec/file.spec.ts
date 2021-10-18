import { addExtensionIfNotFound } from ".."

describe('file utils', () => {
	it('should add extension if missing', async () => {
		expect(addExtensionIfNotFound('test', 'ext')).toEqual('.ext')
		expect(addExtensionIfNotFound('test.test', 'ext')).toEqual('.ext')
		expect(addExtensionIfNotFound('test.sas', 'ext')).toEqual('')
		expect(addExtensionIfNotFound('test.test.test', 'ext')).toEqual('.ext')
		expect(addExtensionIfNotFound('test.test.test.sas', 'ext')).toEqual('')
	})
})