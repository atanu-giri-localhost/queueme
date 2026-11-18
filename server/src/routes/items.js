import { Router } from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/itemController.js';
import {
  createItemSchema,
  updateItemSchema,
  queryParamsSchema,
  validateBody,
  validateQuery,
} from '../validators/itemValidator.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// Protect all item routes with authentication
router.use(requireAuth);

// List items with filters, sorting, and search
router.get('/', validateQuery(queryParamsSchema), getItems);

// Retrieve single item
router.get('/:id', getItemById);

// Create item
router.post('/', validateBody(createItemSchema), createItem);

// Update item (supports PATCH & PUT)
router.patch('/:id', validateBody(updateItemSchema), updateItem);
router.put('/:id', validateBody(updateItemSchema), updateItem);

// Delete item
router.delete('/:id', deleteItem);

export default router;
