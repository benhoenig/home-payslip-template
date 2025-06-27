const express = require('express');
const bodyParser = require('body-parser');
const Mustache = require('mustache');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const ejs = require('ejs');

// Conditional import for Puppeteer based on environment
let puppeteer, chromium;
if (process.env.NODE_ENV === 'production') {
  // Use chrome-aws-lambda in production (Vercel)
  chromium = require('chrome-aws-lambda');
  puppeteer = chromium.puppeteer;
} else {
  // Use regular puppeteer in development
  puppeteer = require('puppeteer');
}

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev')); // Logging
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json({ limit: '10mb' })); // Increase limit for larger JSON payloads
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public')); // Serve static files from 'public' directory

// Set EJS as the view engine for the dashboard
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Load template
const templatePath = path.join(__dirname, 'payslip_template.html');
let template = fs.readFileSync(templatePath, 'utf8');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Copy logo to public directory if it doesn't exist there
const logoSource = path.join(__dirname, 'home_logo.svg');
const logoDestination = path.join(publicDir, 'home_logo.svg');
if (fs.existsSync(logoSource) && !fs.existsSync(logoDestination)) {
  fs.copyFileSync(logoSource, logoDestination);
  console.log('Logo file copied to public directory');
}

// Copy sample_data.json to public directory if it doesn't exist there
const sampleDataSource = path.join(__dirname, 'sample_data.json');
const sampleDataDestination = path.join(publicDir, 'sample_data.json');
if (fs.existsSync(sampleDataSource) && !fs.existsSync(sampleDataDestination)) {
  fs.copyFileSync(sampleDataSource, sampleDataDestination);
  console.log('Sample data file copied to public directory');
}

// Update template to use logo from public directory
template = template.replace('src="home_logo.svg"', 'src="/home_logo.svg"');

// Track statistics
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  lastRequestTime: null,
  processingTimes: []
};

// Recent logs (last 20)
const logs = [];
const MAX_LOGS = 20;

// Add a log entry
function addLog(type, message, details = null) {
  const log = {
    type,
    message,
    details,
    timestamp: new Date()
  };
  logs.unshift(log); // Add to beginning
  if (logs.length > MAX_LOGS) {
    logs.pop(); // Remove oldest
  }
  return log;
}

// Dashboard route
app.get('/', (req, res) => {
  res.render('dashboard', {
    stats,
    logs,
    avgProcessingTime: stats.processingTimes.length > 0 
      ? (stats.processingTimes.reduce((a, b) => a + b, 0) / stats.processingTimes.length).toFixed(2)
      : 0
  });
});

// API Documentation route
app.get('/api-docs', (req, res) => {
  res.render('api-docs');
});

// Route to serve sample data JSON directly
app.get('/sample_data.json', (req, res) => {
  try {
    const sampleDataPath = path.join(__dirname, 'sample_data.json');
    const sampleData = fs.readFileSync(sampleDataPath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(sampleData);
  } catch (error) {
    console.error('Error serving sample data:', error);
    res.status(500).json({ error: 'Error serving sample data' });
  }
});

// Template preview route
app.get('/template-preview', (req, res) => {
  res.send(template);
});

// Sample data preview route
app.get('/sample-preview', async (req, res) => {
  try {
    const sampleDataPath = path.join(__dirname, 'sample_data.json');
    let sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
    
    // Process data for template (handle line breaks)
    if (sampleData.Company_Name_Address) {
      sampleData.Company_Name_Address = sampleData.Company_Name_Address.replace(/\\n/g, '<br>');
    }
    if (sampleData.Notes) {
      sampleData.Notes = sampleData.Notes.replace(/\\n/g, '<br>');
    }
    
    // Render template with sample data
    const renderedHtml = Mustache.render(template, sampleData);
    res.send(renderedHtml);
  } catch (error) {
    console.error('Error generating sample preview:', error);
    res.status(500).send('Error generating sample preview');
  }
});

// Generate PDF from JSON data
app.post('/generate-pdf', async (req, res) => {
  const startTime = Date.now();
  stats.totalRequests++;
  stats.lastRequestTime = new Date();
  
  try {
    // Get data from request body
    const data = req.body;
    
    if (!data) {
      const log = addLog('error', 'No data provided');
      stats.failedRequests++;
      return res.status(400).json({ error: 'No data provided', log });
    }

    // Process data for template (handle line breaks)
    if (data.Company_Name_Address) {
      data.Company_Name_Address = data.Company_Name_Address.replace(/\\n/g, '<br>');
    }
    if (data.Notes) {
      data.Notes = data.Notes.replace(/\\n/g, '<br>');
    }
    
    // Render template with data
    const renderedHtml = Mustache.render(template, data);
    
    // Generate PDF - with conditional browser launch options
    let browser;
    if (process.env.NODE_ENV === 'production') {
      // Use chrome-aws-lambda in production (Vercel)
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
      });
    } else {
      // Use regular puppeteer in development
      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: 'new'
      });
    }
    
    const page = await browser.newPage();
    
    // Set content and wait for fonts to load
    await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    });
    
    await browser.close();
    
    // Update stats
    const processingTime = Date.now() - startTime;
    stats.processingTimes.push(processingTime);
    if (stats.processingTimes.length > 50) {
      stats.processingTimes.shift(); // Keep only last 50 times
    }
    stats.successfulRequests++;
    
    // Add log
    addLog('success', 'PDF generated successfully', { 
      name: data.Sales_Name ? `${data.Sales_Name} ${data.Sales_Last_Name || ''}` : 'Unknown',
      processingTime: `${processingTime}ms`
    });
    
    // Send PDF as response
    res.contentType('application/pdf');
    res.send(pdf);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    stats.failedRequests++;
    const log = addLog('error', 'Failed to generate PDF', { error: error.message });
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message, log });
  }
});

// Preview route (returns HTML instead of PDF)
app.post('/preview', (req, res) => {
  try {
    const data = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    // Process data for template
    if (data.Company_Name_Address) {
      data.Company_Name_Address = data.Company_Name_Address.replace(/\\n/g, '<br>');
    }
    if (data.Notes) {
      data.Notes = data.Notes.replace(/\\n/g, '<br>');
    }
    
    // Render template with data
    const renderedHtml = Mustache.render(template, data);
    
    // Send HTML as response
    res.contentType('text/html');
    res.send(renderedHtml);
    
    addLog('info', 'HTML preview generated');
    
  } catch (error) {
    console.error('Error generating preview:', error);
    addLog('error', 'Failed to generate HTML preview', { error: error.message });
    res.status(500).json({ error: 'Failed to generate preview', details: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Payslip Generator API running on port ${port}`);
  console.log(`Dashboard available at http://localhost:${port}`);
}); 