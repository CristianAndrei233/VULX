import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Load OpenAPI specification
const openApiPath = path.join(__dirname, 'openapi.yaml');
const openApiSpec = YAML.parse(fs.readFileSync(openApiPath, 'utf8'));

// Swagger UI configuration
const swaggerOptions: swaggerUi.SwaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { font-size: 2.5em; color: #4F46E5; }
    .swagger-ui .info .description { font-size: 1.1em; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; }
    .swagger-ui .btn.execute { background-color: #4F46E5; border-color: #4F46E5; }
    .swagger-ui .btn.execute:hover { background-color: #3730A3; border-color: #3730A3; }
    .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #059669; }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #2563eb; }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #dc2626; }
    .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #d97706; }
    .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #7c3aed; }
  `,
  customSiteTitle: 'VULX API Documentation',
  customfavIcon: '/favicon.ico',
};

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
app.use(cors());
app.use(express.json());

import projectRoutes from './routes/projects';
import billingRoutes from './routes/billing';

// Swagger UI documentation endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, swaggerOptions));

// Serve OpenAPI spec as JSON
app.get('/api-docs.json', (req, res) => {
  res.json(openApiSpec);
});

// Serve OpenAPI spec as YAML
app.get('/api-docs.yaml', (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(fs.readFileSync(openApiPath, 'utf8'));
});

// Use raw body for Stripe webhooks
app.use('/billing/webhook', express.raw({ type: 'application/json' }));

app.use('/projects', projectRoutes);
app.use('/billing', billingRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'vulx-api' });
});

// Root redirect to API docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

app.listen(port, () => {
  console.log(`API Server running on port ${port}`);
  console.log(`API Documentation available at http://localhost:${port}/api-docs`);
});
