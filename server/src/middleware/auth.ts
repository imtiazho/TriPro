import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseIdToken } from '../config/firebase';
import { User, IUser } from '../models/User';
import { logger } from '../utils/logger';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid Authorization header. Expected Bearer <token>.',
        },
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1].trim();
    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Bearer token is empty.',
        },
      });
      return;
    }

    // Verify token with Firebase Admin
    const decoded = await verifyFirebaseIdToken(token);

    // Look up verified user in MongoDB by trusted Firebase UID
    let user = await User.findOne({ firebaseUid: decoded.uid });

    // Prevent duplicate user records: check by normalized email if UID lookup missed
    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email.toLowerCase().trim() });
      if (user) {
        user.firebaseUid = decoded.uid;
        if (decoded.name && !user.displayName) {
          user.displayName = decoded.name;
        }
        await user.save();
      }
    }

    if (!user) {
      // If user exists in Firebase but not yet in MongoDB, create with safe default role
      user = await User.create({
        firebaseUid: decoded.uid,
        email: decoded.email || `${decoded.uid}@tripro.local`,
        displayName: decoded.name || decoded.email?.split('@')[0] || 'TriPro User',
        role: 'employee', // Safe default! Never elevated to super-admin via public auth.
        status: 'active',
        lastLoginAt: new Date(),
      });
      logger.info({ uid: decoded.uid, email: user.email }, 'Auto-provisioned initial user with safe default employee role');
    } else {
      user.lastLoginAt = new Date();
      await user.save();
    }

    if (user.status === 'suspended') {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account is suspended. Please contact your organization administrator.',
        },
      });
      return;
    }

    req.user = user;
    req.userRole = user.role;
    next();
  } catch (error) {
    logger.warn({ error: (error as Error).message }, 'Authentication verification failed');
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authentication failed. Please log in again.',
      },
    });
  }
}
