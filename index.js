import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/pdf', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Falta url' });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 816, height: 1056 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Ocultar botones para el PDF
    await page.addStyleTag({ content: '.actions-outer { display: none !important; } .edit-banner { display: none !important; }' });

    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="informe-gorental.pdf"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(pdf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`PDF service running on port ${PORT}`));
