import Joi from 'joi';

export const PostAuthenticationPayloadSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const PutAuthenticationPayloadSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const DeleteAuthenticationPayloadSchema = Joi.object({
  refreshToken: Joi.string().required(),
});