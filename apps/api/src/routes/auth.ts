import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  organizationName: z.string().optional()
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, organizationName } = RegisterSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and optionally organization
    const result = await prisma.$transaction(async (tx) => {
      let orgId;
      
      if (organizationName) {
        const org = await tx.organization.create({
          data: { name: organizationName }
        });
        orgId = org.id;
      }

      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          name,
          organizationId: orgId,
          onboardingCompleted: true 
        }
      });

      return user;
    });

    const token = jwt.sign(
      { userId: result.id, email: result.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      user: { 
        id: result.id, 
        email: result.email, 
        name: result.name,
        role: result.role,
        organizationId: result.organizationId
      } 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role,
        organizationId: user.organizationId
      } 
    });
  } catch (error) {
    res.status(400).json({ error: 'Login failed' });
  }
});

// GET CURRENT USER
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { organization: true, subscription: { include: { plan: true } } }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// UPDATE PROFILE
router.put('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Check if email is taken by another user
    if (email) {
        const existing = await prisma.user.findFirst({
            where: { email, id: { not: userId } }
        });
        if (existing) return res.status(400).json({ error: 'Email already in use' });
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
            name: name || undefined, 
            email: email || undefined 
        },
        include: { organization: true }
    });

    const { passwordHash, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// CHANGE PASSWORD
router.put('/password', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.passwordHash) return res.status(404).json({ error: 'User not found' });

        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) return res.status(400).json({ error: 'Incorrect current password' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: hashedPassword }
        });

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// DELETE ACCOUNT
router.delete('/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Logic to delete user and potentially organization if only user
        // For MVP, just delete the user
        await prisma.user.delete({ where: { id: userId } });
        
        res.json({ success: true, message: 'Account deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

export default router;
