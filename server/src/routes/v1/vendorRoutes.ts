import { Router } from 'express';
import { VendorController } from '../../controllers/vendorController';
import { requireAuth } from '../../middleware/auth';
import { requireTenantContext } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/rbac';
import { PERMISSIONS } from '../../constants/permissions';
import { validateBody } from '../../middleware/validate';
import { createVendorSchema } from '../../validators/schemas';

const router = Router();

router.use(requireAuth);
router.use(requireTenantContext);

router.get('/', requirePermission(PERMISSIONS.VENDOR_VIEW), VendorController.getVendors);
router.get('/:id', requirePermission(PERMISSIONS.VENDOR_VIEW), VendorController.getVendorById);
router.post(
  '/',
  requirePermission(PERMISSIONS.VENDOR_MANAGE),
  validateBody(createVendorSchema),
  VendorController.createVendor
);
router.patch('/:id', requirePermission(PERMISSIONS.VENDOR_MANAGE), VendorController.updateVendor);
router.delete('/:id', requirePermission(PERMISSIONS.VENDOR_MANAGE), VendorController.deleteVendor);

export default router;
