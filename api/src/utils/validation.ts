import Joi from 'joi'

const usernameSchema = Joi.string().alphanum().min(3).max(16)
const passwordSchema = Joi.string().min(6).max(1024)

export const blockFileRegex = /\.(exe|sh|htaccess)$/i

export const loginWebValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    username: usernameSchema.required(),
    password: passwordSchema.required()
  }).validate(data)

export const authorizeValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    clientId: Joi.string().required()
  }).validate(data)

export const tokenValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    clientId: Joi.string().required(),
    code: Joi.string().required()
  }).validate(data)

export const registerGroupValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    name: Joi.string().min(6).required(),
    description: Joi.string(),
    isActive: Joi.boolean()
  }).validate(data)

export const registerUserValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    displayName: Joi.string().min(6).required(),
    username: usernameSchema.required(),
    password: passwordSchema.required(),
    isAdmin: Joi.boolean(),
    isActive: Joi.boolean()
  }).validate(data)

export const deleteUserValidation = (
  data: any,
  isAdmin: boolean = false
): Joi.ValidationResult =>
  Joi.object(
    isAdmin
      ? {}
      : {
          password: passwordSchema.required()
        }
  ).validate(data)

export const updateUserValidation = (
  data: any,
  isAdmin: boolean = false
): Joi.ValidationResult => {
  const validationChecks: any = {
    displayName: Joi.string().min(6),
    username: usernameSchema,
    password: passwordSchema
  }
  if (isAdmin) {
    validationChecks.isAdmin = Joi.boolean()
    validationChecks.isActive = Joi.boolean()
  }
  return Joi.object(validationChecks).validate(data)
}

export const registerClientValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required()
  }).validate(data)

export const deployValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    appLoc: Joi.string().pattern(/^\//).required().min(2),
    streamServiceName: Joi.string(),
    streamWebFolder: Joi.string(),
    streamLogo: Joi.string(),
    fileTree: Joi.any().required()
  }).validate(data)

const filePathSchema = Joi.string()
  .custom((value, helpers) => {
    if (blockFileRegex.test(value)) return helpers.error('string.pattern.base')

    return value
  })
  .required()
  .messages({
    'string.pattern.base': `Invalid file extension`
  })

export const fileBodyValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    filePath: filePathSchema
  }).validate(data)

export const fileParamValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    _filePath: filePathSchema
  }).validate(data)

export const folderParamValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    _folderPath: Joi.string()
  }).validate(data)

export const runSASValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    code: Joi.string().required()
  }).validate(data)

export const executeProgramRawValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    _program: Joi.string().required()
  })
    .pattern(/^/, Joi.alternatives(Joi.string(), Joi.number()))
    .validate(data)
