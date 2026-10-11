import { Router } from 'express';
import { PolicyController } from '../../controllers/policyController';
import { requireAuth } from '../../middleware/auth';
import { requireTenantContext } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/rbac';
import { PERMISSIONS } from '../../constants/permissions';
import { validateBody } from '../../middleware/validate';
import { createPolicySchema } from '../../validators/schemas';

const router = Router();

router.use(requireAuth);
router.use(requireTenantContext);

router.get('/', requirePermission(PERMISSIONS.POLICY_VIEW), PolicyController.getPolicies);
router.post(
  '/',
  requirePermission(PERMISSIONS.POLICY_MANAGE),
  validateBody(createPolicySchema),
  PolicyController.createPolicy
);
router.patch('/:id', requirePermission(PERMISSIONS.POLICY_MANAGE), PolicyController.updatePolicy);
router.post('/:id/acknowledge', requirePermission(PERMISSIONS.POLICY_ACKNOWLEDGE), PolicyController.acknowledgePolicy);

export default router;
