import { Router } from 'express';
import { TaskController } from '../../controllers/taskController';
import { requireAuth } from '../../middleware/auth';
import { requireTenantContext } from '../../middleware/tenant';
import { validateBody } from '../../middleware/validate';
import { createTaskSchema, updateTaskSchema } from '../../validators/schemas';

const router = Router();

router.use(requireAuth);
router.use(requireTenantContext);

router.get('/', TaskController.getTasks);
router.post('/', validateBody(createTaskSchema), TaskController.createTask);
router.patch('/:id', validateBody(updateTaskSchema), TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);

export default router;
