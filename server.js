import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sendEmailHandler from './api/send-email.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

app.use(express.json());

// API route — adapt Vercel-style handler to Express
app.post('/api/send-email', (req, res) => sendEmailHandler(req, res));

// Serve static files from the Vite build output
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback — serve index.html for all non-API, non-static routes
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
