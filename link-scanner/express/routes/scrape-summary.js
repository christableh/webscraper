import express from 'express';
import { exec } from 'child_process';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Helper to render the page with Playwright
const renderPage = async (url) => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`[LOG]: Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'load', timeout: 30000 }); // Adjust timeout as needed

    const html = await page.content();
    console.log(`[LOG]: Successfully rendered the page.`);
    return html;
  } catch (error) {
    console.error(`[ERROR]: Failed to render ${url}:`, error.message);
    throw new Error(`Failed to render URL: ${url}. Error: ${error.message}`);
  } finally {
    console.log(`[LOG]: Closing browser.`);
    await browser.close(); // Ensure browser is closed in all cases
  }
};

// Helper to run the Python script
const runPythonScraper = (htmlContent) => {
  const filePath = path.join('/tmp', `rendered_page_${Date.now()}.html`);
  fs.writeFileSync(filePath, htmlContent, 'utf8'); // Save rendered HTML to a temp file

  const command = `python3 /app/python_scripts/scrape_html.py "${filePath}"`;
  console.log(`[LOG]: Running Python scraper with command: ${command}`);

  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      // Clean up the temporary file regardless of success or error
      fs.unlink(filePath, (unlinkError) => {
        if (unlinkError) console.warn(`[WARN]: Failed to delete temp file: ${filePath}`);
      });

      if (error) {
        console.error(`[ERROR]: Python scraper failed: ${error.message}`);
        reject(new Error(`Python execution error: ${error.message}`));
        return;
      }

      if (stderr) {
        console.warn(`[WARN]: Python scraper stderr: ${stderr}`);
      }

      try {
        const result = JSON.parse(stdout); // Parse JSON response
        resolve(result);
      } catch (err) {
        console.error(`[ERROR]: Failed to parse Python output: ${err.message}`);
        reject(new Error(`Error parsing Python output: ${err.message}`));
      }
    });
  });
};


// API route for scraping
router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    console.error(`[ERROR]: Invalid or missing URL.`);
    return res.status(400).json({ error: 'Invalid or missing URL' });
  }

  try {
    console.log(`[LOG]: Rendering page with Playwright.`);
    const renderedHTML = await renderPage(url);

    console.log(`[LOG]: Passing rendered HTML to Python scraper.`);
    const scrapeResult = await runPythonScraper(renderedHTML);

    console.log(`[LOG]: Scraping completed. Sending response.`);
    res.status(200).json({
      message: 'Scraping complete',
      result: scrapeResult,
    });
  } catch (error) {
    console.error(`[ERROR]: Failed to scrape URL: ${error.message}`);
    res.status(500).json({ error: `Failed to scrape URL: ${error.message}` });
  }
});


export default router;
