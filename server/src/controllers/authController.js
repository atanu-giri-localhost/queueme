import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'queueme_dev_jwt_secret_fallback_key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Generate a JWT token containing user identity
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
    },
    JWT_SECRET,
    { expiresIn: '14d' }
  );
}

/**
 * Safe user response serializer (strips password)
 */
function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    provider: user.provider,
    createdAt: user.createdAt,
  };
}

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
export async function register(req, res, next) {
  try {
    const { email, password, name } = req.validatedBody;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        provider: 'LOCAL',
      },
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Log in with email and password
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.validatedBody;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // If account was created via Google and has no password
    if (user.provider === 'GOOGLE' && !user.password) {
      return res.status(400).json({
        success: false,
        error: 'This account was created with Google Sign-In. Please sign in with Google.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/google
 * Authenticate or register using a Google ID token from frontend
 */
export async function googleAuth(req, res, next) {
  try {
    const { credential } = req.validatedBody;

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID || undefined,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      return res.status(401).json({
        success: false,
        error: 'Google authentication failed: Invalid or expired token',
        details: verifyErr.message,
      });
    }

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        error: 'Google profile does not contain a verified email address',
      });
    }

    const { email, sub: googleId, name, picture: avatarUrl } = payload;

    // Find existing user by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
    });

    let isNewUser = false;
    if (user) {
      // Update Google ID or avatar if not set
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId || googleId,
          avatarUrl: user.avatarUrl || avatarUrl,
          name: user.name || name,
        },
      });
    } else {
      // Create new user via Google OAuth
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          name: name || email.split('@')[0],
          avatarUrl: avatarUrl || null,
          provider: 'GOOGLE',
        },
      });
      isNewUser = true;
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: serializeUser(user),
      isNewUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Retrieve profile of currently authenticated user
 */
export async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
}
