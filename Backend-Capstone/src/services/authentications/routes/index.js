import { Router } from 'express';
import validate from '../../../middlewares/validate.js';
import authMiddleware from '../../../middlewares/auth.js';
import { login, refreshToken, logout } from '../controller/authentication-controller.js';
import {
  PostAuthenticationPayloadSchema,
  PutAuthenticationPayloadSchema,
  DeleteAuthenticationPayloadSchema
} from '../validator/schema.js';

const router = Router();

router.post('/authentications', validate(PostAuthenticationPayloadSchema), login);
router.put('/authentications', validate(PutAuthenticationPayloadSchema), refreshToken);
router.delete('/authentications', authMiddleware, validate(DeleteAuthenticationPayloadSchema), logout);

export default router;