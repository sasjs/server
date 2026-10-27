import Joi from 'joi'
import {
  PermissionType,
  PermissionSettingForRoute,
  PrincipalType
} from '../controllers/permission'
import { getAuthorizedRoutes } from './getAuthorizedRoutes'

const usernameSchema = Joi.string().lowercase().alphanum().min(3).max(16)
const passwordSchema = Joi.string().min(6).max(1024)
const groupnameSchema = Joi.string().lowercase().alphanum().min(3).max(16)

export const blockFileRegex = /\.(exe|sh|htaccess)$/i

export const uidValidation = (data: any) =>
  Joi.object({
    uid: Joi.string().length(24).hex().required()
  }).validate(data)

export const groupUserUidValidation = (data: any) =>
  Joi.object({
    groupUid: Joi.string().length(24).hex().required(),
    userUid: Joi.string().length(24).hex().required()
  }).validate(data)

export const getUserValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    username: usernameSchema.required()
  }).validate(data)

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
    name: groupnameSchema.required(),
    description: Joi.string(),
    isActive: Joi.boolean()
  }).validate(data)

export const getGroupValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    name: groupnameSchema.required()
  }).validate(data)

export const registerUserValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    displayName: Joi.string().min(6).required(),
    username: usernameSchema.required(),
    password: passwordSchema.required(),
    isAdmin: Joi.boolean(),
    isActive: Joi.boolean(),
    autoExec: Joi.string().allow('')
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
    password: passwordSchema,
    autoExec: Joi.string().allow('')
  }
  if (isAdmin) {
    validationChecks.isAdmin = Joi.boolean()
    validationChecks.isActive = Joi.boolean()
  }
  return Joi.object(validationChecks).validate(data)
}

export const updatePasswordValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: passwordSchema.required()
  }).validate(data)

export const registerClientValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required(),
    accessTokenExpiration: Joi.number(),
    refreshTokenExpiration: Joi.number()
  }).validate(data)

export const registerPermissionValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    path: Joi.string()
      .required()
      .valid(...getAuthorizedRoutes()),
    type: Joi.string()
      .required()
      .valid(...Object.values(PermissionType)),
    setting: Joi.string()
      .required()
      .valid(...Object.values(PermissionSettingForRoute)),
    principalType: Joi.string()
      .required()
      .valid(...Object.values(PrincipalType)),
    principalId: Joi.string().length(24).hex().required()
  }).validate(data)

export const updatePermissionValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    setting: Joi.string()
      .required()
      .valid(...Object.values(PermissionSettingForRoute))
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

export const folderParamValidation = (
  data: any,
  folderPathRequired?: boolean
): Joi.ValidationResult =>
  Joi.object({
    _folderPath: folderPathRequired ? Joi.string().required() : Joi.string()
  }).validate(data)

/**
 * The file tree is the one route that accepts an EMPTY `_folderPath`, meaning
 * the drive root: the browser starts by asking for the root level, and the same
 * route with no parameter at all returns the whole tree. The generic folder
 * validation keeps rejecting '' so that an empty path can never reach the
 * delete-folder endpoint, where it would name the drive root.
 */
export const fileTreeParamValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    _folderPath: Joi.string().allow('')
  })
    // Unknown query parameters are tolerated: this route ignored them before it
    // had any validation at all, and a cache-buster or a tracking parameter an
    // existing client appends must not turn a working request into a 400.
    .unknown(true)
    .validate(data)

export const folderBodyValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    folderPath: Joi.string().required()
  }).validate(data)

export const renameBodyValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    oldPath: Joi.string().required(),
    newPath: Joi.string().required()
  }).validate(data)

export const runCodeValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    code: Joi.string().required(),
    runTime: Joi.string().valid(...process.runTimes)
  }).validate(data)

export const lintCodeValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    code: Joi.string().required(),
    filePath: Joi.string()
  }).validate(data)

export const formatCodeValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    code: Joi.string().required(),
    filePath: Joi.string()
  }).validate(data)

export const triggerCodeValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    code: Joi.string().required(),
    runTime: Joi.string().valid(...process.runTimes),
    expiresAfterMins: Joi.number().greater(0)
  }).validate(data)

// `_debug` follows the SAS Application Broker convention, where a keyword works
// as well as the number (128 = LOG there, 131 in SASjs); parseDebugValue turns
// any name into the value the macros test with `%if &_debug ge 131`
const debugValue = Joi.alternatives().try(Joi.number(), Joi.string())

export const executeProgramRawValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    _program: Joi.string().required(),
    _debug: debugValue
  })
    .pattern(/^/, Joi.alternatives(Joi.string(), Joi.number()))
    .validate(data)

export const triggerProgramValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    _program: Joi.string().required(),
    _debug: debugValue,
    expiresAfterMins: Joi.number().greater(0)
  })
    .pattern(/^/, Joi.alternatives(Joi.string(), Joi.number()))
    .validate(data)

export const sessionIdValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    sessionId: Joi.string().required()
  }).validate(data)
