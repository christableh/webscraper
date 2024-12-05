import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Handle ES module path issue
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3002;

// Serve static files from the Docusaurus build folder
app.use(express.static(path.join(__dirname, '../docs/build')));

// Serve Docusaurus for any unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/build', 'index.html'));
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Docusaurus running on http://localhost:${port}`);
});
