import express from 'express';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from '../controllers/noteController.js';
import {
  validateCreateNote,
  validateUpdateNote,
} from '../validators/noteValidator.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// All note routes require user authentication
router.use(requireAuth);

router.get('/', getNotes);
router.get('/:id', getNoteById);
router.post('/', validateCreateNote, createNote);
router.patch('/:id', validateUpdateNote, updateNote);
router.delete('/:id', deleteNote);

export default router;
