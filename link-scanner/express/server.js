import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import checkLivenessRoute from './routes/check-liveness.js';
import scrapeSummaryRoute from './routes/scrape-summary.js';

// Handle ES module path issue
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3002;

// Middleware
app.use(cors({}));
app.use(express.json());

// API Routes
app.use('/check-liveness', checkLivenessRoute);
app.use('/scrape-summary', scrapeSummaryRoute);

// Serve static files from the React app build (Homepage)
app.use(express.static(path.join(__dirname, '../react/build')));

// Serve React app for any unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../react/build', 'index.html'));
});

// Start server for React
app.listen(port, () => {
  console.log(`React app running on http://localhost:${port}`);
});
