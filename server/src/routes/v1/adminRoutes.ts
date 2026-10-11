import { Router } from 'express';
import { AdminController } from '../../controllers/adminController';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { ROLES } from '../../constants/roles';

const router = Router();

// Only Super-Admins can access platform admin endpoints!
router.use(requireAuth);
router.use(requireRole(ROLES.SUPER_ADMIN));

router.get('/stats', AdminController.getPlatformStats);
router.get('/organizations', AdminController.getOrganizations);
router.post('/organizations', AdminController.createOrganization);
router.patch('/organizations/:id/status', AdminController.updateOrganizationStatus);
router.get('/audit-logs', AdminController.getPlatformAuditLogs);

export default router;
