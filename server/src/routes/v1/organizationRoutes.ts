import { Router } from 'express';
import { OrganizationController } from '../../controllers/organizationController';
import { requireAuth } from '../../middleware/auth';
import { requireTenantContext } from '../../middleware/tenant';
import { requireRole } from '../../middleware/rbac';
import { ROLES } from '../../constants/roles';

const router = Router();

router.use(requireAuth);
router.use(requireTenantContext);

router.get('/', OrganizationController.getOrganization);
router.patch('/', requireRole(ROLES.ORGANIZATION_ADMIN), OrganizationController.updateOrganization);
router.get('/members', OrganizationController.getMembers);
router.post('/members/invite', requireRole(ROLES.ORGANIZATION_ADMIN), OrganizationController.inviteMember);
router.patch('/members/:membershipId', requireRole(ROLES.ORGANIZATION_ADMIN), OrganizationController.updateMemberRole);

export default router;
