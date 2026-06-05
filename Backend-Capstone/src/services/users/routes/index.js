import { Router } from 'express';
import { createUser, getUserById } from '../controller/user-controller.js';
import validate from '../../../middlewares/validate.js';
import { badUserPayloads } from '../../../services/users/validator/schema.js';

const router = Router();

router.post('/users', validate(badUserPayloads), createUser);
router.get('/users/:userId', getUserById);

export default router;