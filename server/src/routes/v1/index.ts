import { Router } from 'express';
import authRoutes from './authRoutes';
import organizationRoutes from './organizationRoutes';
import complianceRoutes from './complianceRoutes';
import taskRoutes from './taskRoutes';
import evidenceRoutes from './evidenceRoutes';
import hrRoutes from './hrRoutes';
import vendorRoutes from './vendorRoutes';
import riskRoutes from './riskRoutes';
import findingRoutes from './findingRoutes';
import policyRoutes from './policyRoutes';
import notificationRoutes from './notificationRoutes';
import reportRoutes from './reportRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/organization', organizationRoutes);
router.use('/compliance', complianceRoutes);
router.use('/tasks', taskRoutes);
router.use('/evidence', evidenceRoutes);
router.use('/hr', hrRoutes);
router.use('/vendors', vendorRoutes);
router.use('/risks', riskRoutes);
router.use('/findings', findingRoutes);
router.use('/policies', policyRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);

export default router;
