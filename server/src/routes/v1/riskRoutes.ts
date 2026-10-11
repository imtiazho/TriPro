import { Router } from 'express';
import { RiskController } from '../../controllers/riskController';
import { requireAuth } from '../../middleware/auth';
import { requireTenantContext } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/rbac';
import { PERMISSIONS } from '../../constants/permissions';
import { validateBody } from '../../middleware/validate';
import { createRiskSchema } from '../../validators/schemas';

const router = Router();

router.use(requireAuth);
router.use(requireTenantContext);

router.get('/', requirePermission(PERMISSIONS.RISK_VIEW), RiskController.getRisks);
router.post(
  '/',
  requirePermission(PERMISSIONS.RISK_MANAGE),
  validateBody(createRiskSchema),
  RiskController.createRisk
);
router.patch('/:id', requirePermission(PERMISSIONS.RISK_MANAGE), RiskController.updateRisk);
router.delete('/:id', requirePermission(PERMISSIONS.RISK_MANAGE), RiskController.deleteRisk);

export default router;
