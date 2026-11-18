import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  getMe,
} from '../controllers/authController.js';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  validateBody,
} from '../validators/authValidator.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// Register with email and password
router.post('/register', validateBody(registerSchema), register);

// Log in with email and password
router.post('/login', validateBody(loginSchema), login);

// Authenticate via Google OAuth credential
router.post('/google', validateBody(googleAuthSchema), googleAuth);

// Get current user profile (protected)
router.get('/me', requireAuth, getMe);

export default router;
