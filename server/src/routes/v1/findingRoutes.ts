import { Router } from 'express';
import { FindingController } from '../../controllers/findingController';
import { requireAuth } from '../../middleware/auth';
import { requireTenantContext } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/rbac';
import { PERMISSIONS } from '../../constants/permissions';
import { validateBody } from '../../middleware/validate';
import { createFindingSchema, createCorrectiveActionSchema } from '../../validators/schemas';

const router = Router();

router.use(requireAuth);
router.use(requireTenantContext);

router.get('/', requirePermission(PERMISSIONS.FINDING_VIEW), FindingController.getFindings);
router.post(
  '/',
  requirePermission(PERMISSIONS.FINDING_MANAGE),
  validateBody(createFindingSchema),
  FindingController.createFinding
);
router.patch('/:id', requirePermission(PERMISSIONS.FINDING_MANAGE), FindingController.updateFinding);

// Corrective Actions (CAPA) routes
router.post(
  '/:findingId/actions',
  requirePermission(PERMISSIONS.FINDING_MANAGE),
  validateBody(createCorrectiveActionSchema),
  FindingController.createCorrectiveAction
);
router.patch(
  '/actions/:actionId',
  requirePermission(PERMISSIONS.FINDING_MANAGE),
  FindingController.updateCorrectiveAction
);

export default router;
