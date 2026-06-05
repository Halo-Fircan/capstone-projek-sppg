import Joi from 'joi';

export const badUserPayloads = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('user', 'admin', 'dinas').default('user'),
});