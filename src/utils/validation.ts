import Joi from 'joi'

const usernameSchema = Joi.string().alphanum().min(6).max(20).required()
const passwordSchema = Joi.string().min(6).max(1024).required()

export const authorizeValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    username: usernameSchema,
    password: passwordSchema,
    client_id: Joi.string().required()
  }).validate(data)

export const tokenValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    client_id: Joi.string().required(),
    client_secret: Joi.string().required(),
    code: Joi.string().required()
  }).validate(data)

export const registerValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    displayname: Joi.string().min(6).required(),
    username: usernameSchema,
    password: passwordSchema,
    isadmin: Joi.boolean(),
    isactive: Joi.boolean()
  }).validate(data)
