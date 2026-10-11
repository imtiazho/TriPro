import { Router } from 'express';
import { AuthController } from '../../controllers/authController';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.get('/me', requireAuth, AuthController.getCurrentUser);
router.patch('/profile', requireAuth, AuthController.updateProfile);
router.post('/switch-org', requireAuth, AuthController.switchOrganization);

export default router;
