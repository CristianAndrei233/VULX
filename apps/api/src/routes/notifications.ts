import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get Notifications
router.get('/', async (req, res) => {
    const user = (req as AuthRequest).user!;
    const environment = req.environment || 'PRODUCTION';

    const alerts = await prisma.alert.findMany({
        where: { 
            userId: user.id,
            environment // Filter by environment
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    const unreadCount = await prisma.alert.count({
        where: { 
            userId: user.id,
            environment,
            isRead: false
        }
    });

    res.json({ alerts, unreadCount });
});

// Mark as Read
router.put('/:id/read', async (req, res) => {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    try {
        await prisma.alert.update({
            where: { id, userId: user.id },
            data: { isRead: true, readAt: new Date() }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(404).json({ error: 'Alert not found' });
    }
});

// Mark All as Read
router.put('/read-all', async (req, res) => {
    const user = (req as AuthRequest).user!;
    const environment = req.environment || 'PRODUCTION';

    await prisma.alert.updateMany({
        where: { userId: user.id, environment, isRead: false },
        data: { isRead: true, readAt: new Date() }
    });

    res.json({ success: true });
});

export default router;
