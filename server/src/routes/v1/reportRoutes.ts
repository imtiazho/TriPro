import { Router } from 'express';
import { ReportController } from '../../controllers/reportController';
import { requireAuth } from '../../middleware/auth';
import { requireTenantContext } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/rbac';
import { PERMISSIONS } from '../../constants/permissions';
import { strictRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.use(requireAuth);
router.use(requireTenantContext);

router.get('/dashboard', requirePermission(PERMISSIONS.REPORT_VIEW), ReportController.getDashboardMetrics);
router.get(
  '/export/csv',
  requirePermission(PERMISSIONS.REPORT_EXPORT),
  strictRateLimiter,
  ReportController.exportComplianceCSV
);

export default router;
