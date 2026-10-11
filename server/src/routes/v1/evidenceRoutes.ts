import { Router } from 'express';
import { EvidenceController } from '../../controllers/evidenceController';
import { requireAuth } from '../../middleware/auth';
import { requireTenantContext } from '../../middleware/tenant';
import { uploadMiddleware } from '../../services/storageService';

const router = Router();

router.use(requireAuth);
router.use(requireTenantContext);

router.get('/', EvidenceController.getDocuments);
router.post('/upload', uploadMiddleware.single('file'), EvidenceController.uploadDocument);
router.get('/:id/download', EvidenceController.downloadDocument);
router.delete('/:id', EvidenceController.deleteDocument);

export default router;
