import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

// Initialize scheduler
import { initScheduler } from './services/scheduler';
initScheduler();

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import billingRoutes from './routes/billing';
import { authenticateToken } from './middleware/auth';

// Use raw body for Stripe webhooks
app.use('/billing/webhook', express.raw({ type: 'application/json' }));

app.use('/auth', authRoutes);
app.use('/projects', authenticateToken, projectRoutes);
app.use('/billing', authenticateToken, billingRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'vulx-api' });
});

app.listen(port, () => {
  console.log(`API Server running on port ${port}`);
});
