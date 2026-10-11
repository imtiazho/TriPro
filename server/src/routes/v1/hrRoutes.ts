import { Router } from 'express';
import { HRController } from '../../controllers/hrController';
import { requireAuth } from '../../middleware/auth';
import { requireTenantContext } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/rbac';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAuth);
router.use(requireTenantContext);

router.get('/', requirePermission(PERMISSIONS.HR_VIEW), HRController.getEmployees);
router.post('/', requirePermission(PERMISSIONS.HR_MANAGE), HRController.createEmployee);
router.patch('/:id', requirePermission(PERMISSIONS.HR_MANAGE), HRController.updateEmployee);
router.delete('/:id', requirePermission(PERMISSIONS.HR_MANAGE), HRController.deleteEmployee);

export default router;
