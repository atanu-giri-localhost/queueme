import { Router } from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  resetItems,
} from '../controllers/itemController.js';
import {
  createItemSchema,
  updateItemSchema,
  queryParamsSchema,
  validateBody,
  validateQuery,
} from '../validators/itemValidator.js';

const router = Router();

// Re-seed items to sample dataset
router.post('/reset', resetItems);

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
