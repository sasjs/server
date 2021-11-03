import Joi from 'joi'

const usernameSchema = Joi.string().alphanum().min(6).max(20).required()
const passwordSchema = Joi.string().min(6).max(1024).required()

export const authorizeValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    username: usernameSchema,
    password: passwordSchema,
    clientId: Joi.string().required()
  }).validate(data)

export const tokenValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    clientId: Joi.string().required(),
    code: Joi.string().required()
  }).validate(data)

export const registerUserValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    displayName: Joi.string().min(6).required(),
    username: usernameSchema,
    password: passwordSchema,
    isAdmin: Joi.boolean(),
    isActive: Joi.boolean()
  }).validate(data)

export const registerClientValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required()
  }).validate(data)
