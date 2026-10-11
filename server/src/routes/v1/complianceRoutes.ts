import { Router } from 'express';
import { ComplianceController } from '../../controllers/complianceController';
import { requireAuth } from '../../middleware/auth';
import { requireTenantContext } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/rbac';
import { PERMISSIONS } from '../../constants/permissions';
import { validateBody } from '../../middleware/validate';
import { createObligationSchema, updateObligationSchema } from '../../validators/schemas';

const router = Router();

router.use(requireAuth);
router.use(requireTenantContext);

router.get('/', requirePermission(PERMISSIONS.COMPLIANCE_VIEW), ComplianceController.getObligations);
router.get('/:id', requirePermission(PERMISSIONS.COMPLIANCE_VIEW), ComplianceController.getObligationById);
router.post(
  '/',
  requirePermission(PERMISSIONS.COMPLIANCE_CREATE),
  validateBody(createObligationSchema),
  ComplianceController.createObligation
);
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.COMPLIANCE_UPDATE),
  validateBody(updateObligationSchema),
  ComplianceController.updateObligation
);
router.delete('/:id', requirePermission(PERMISSIONS.COMPLIANCE_DELETE), ComplianceController.archiveObligation);

export default router;
