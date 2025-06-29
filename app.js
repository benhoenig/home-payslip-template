const express = require('express');
const bodyParser = require('body-parser');
const Mustache = require('mustache');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const ejs = require('ejs');
const { exec } = require('child_process');

// Puppeteer initialization with improved error handling
let puppeteer;
try {
  // Try to use regular puppeteer first
  puppeteer = require('puppeteer');
  console.log('Using standard puppeteer');
} catch (error) {
  console.error('Error importing standard puppeteer, trying puppeteer-core:', error);
  try {
    // Fall back to puppeteer-core
    puppeteer = require('puppeteer-core');
    console.log('Using puppeteer-core');
  } catch (fallbackError) {
    console.error('Failed to import puppeteer-core:', fallbackError);
    throw new Error('Could not initialize any version of Puppeteer');
  }
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

// Read logo file and convert to base64
const logoPath = path.join(__dirname, 'home_logo.svg');
let logoBase64 = '';
if (fs.existsSync(logoPath)) {
  const logoData = fs.readFileSync(logoPath);
  logoBase64 = `data:image/svg+xml;base64,${logoData.toString('base64')}`;
  console.log('Logo file converted to base64');
}

// Copy logo to public directory if it doesn't exist there (for backward compatibility)
const logoDestination = path.join(publicDir, 'home_logo.svg');
if (fs.existsSync(logoPath) && !fs.existsSync(logoDestination)) {
  fs.copyFileSync(logoPath, logoDestination);
  console.log('Logo file copied to public directory');
}

// Copy sample_data.json to public directory if it doesn't exist there
const sampleDataSource = path.join(__dirname, 'sample_data.json');
const sampleDataDestination = path.join(publicDir, 'sample_data.json');
if (fs.existsSync(sampleDataSource) && !fs.existsSync(sampleDataDestination)) {
  fs.copyFileSync(sampleDataSource, sampleDataDestination);
  console.log('Sample data file copied to public directory');
}

// Update template to use base64 embedded logo
if (logoBase64) {
  template = template.replace(/src="[^"]*home_logo\.svg"/, `src="${logoBase64}"`);
  console.log('Template updated with embedded logo');
}

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

// Chrome diagnostic endpoint
app.get('/check-chrome', async (req, res) => {
  try {
    // Check if Chrome executable exists
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome';
    const exists = fs.existsSync(executablePath);
    
    // Check Chrome with shell command
    let shellOutput = "";
    try {
      shellOutput = await new Promise((resolve, reject) => {
        exec('which google-chrome && google-chrome --version', (error, stdout, stderr) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });
    } catch (shellError) {
      shellOutput = `Error: ${shellError.message}`;
    }
    
    // List available Chrome-like binaries
    let availableBinaries = "";
    try {
      availableBinaries = await new Promise((resolve, reject) => {
        exec('find /usr -name "*chrome*" -type f -executable 2>/dev/null || echo "None found"', (error, stdout, stderr) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });
    } catch (findError) {
      availableBinaries = `Error: ${findError.message}`;
    }
    
    // Try to launch browser
    let browserInfo = "Could not launch browser";
    try {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: executablePath,
        headless: 'new',
        ignoreHTTPSErrors: true,
      }).catch(e => {
        throw new Error(`Launch error: ${e.message}`);
      });
      
      const version = await browser.version();
      browserInfo = `Browser launched successfully. Version: ${version}`;
      await browser.close();
    } catch (browserError) {
      browserInfo = `Browser launch error: ${browserError.message}`;
    }
    
    res.json({
      puppeteerType: puppeteer.name || "unknown",
      chromeExecutablePath: executablePath,
      chromeExists: exists,
      shellCheck: shellOutput,
      availableBrowsers: availableBinaries,
      browserInfo: browserInfo,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD,
        PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// System check endpoint
app.get('/check-system', (req, res) => {
  exec('uname -a && cat /etc/os-release && ls -la /usr/bin/google* || echo "No Google binaries found"', (error, stdout, stderr) => {
    res.json({
      output: stdout,
      error: error ? error.message : null,
      stderr: stderr
    });
  });
});

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
    // Check if data is in req.body directly or in req.body.json
    let data = req.body;
    if (req.body.json && typeof req.body.json === 'string') {
      try {
        data = JSON.parse(req.body.json);
      } catch (jsonError) {
        console.error('Error parsing JSON from form submission:', jsonError);
      }
    }
    
    if (!data) {
      const log = addLog('error', 'No data provided');
      stats.failedRequests++;
      return res.status(400).json({ error: 'No data provided', log });
    }

    // Map new field names to expected field names
    if (data["Other Fees"] !== undefined) {
      data.Other_Fees = data["Other Fees"];
    }
    if (data.Bonus_Amount !== undefined) {
      data.Bonus = data.Bonus_Amount;
    }
    if (data.KPI_Deduction_Amount !== undefined) {
      data.Deduction = data.KPI_Deduction_Amount;
    }
    if (data.Remark !== undefined) {
      data.Notes = data.Remark;
    }
    if (data.Other_Remark !== undefined) {
      data.Other_Fees_Description = data.Other_Remark;
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
    
    // Generate PDF
    let browser;
    try {
      // Determine Chrome executable path with fallbacks
      let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      
      if (!executablePath) {
        const possiblePaths = [
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable',
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser'
        ];
        
        for (const path of possiblePaths) {
          if (fs.existsSync(path)) {
            executablePath = path;
            console.log(`Found Chrome at: ${executablePath}`);
            break;
          }
        }
        
        if (!executablePath) {
          throw new Error('Chrome executable not found in any of the expected locations');
        }
      }
      
      console.log(`Launching browser with executable path: ${executablePath}`);
      
      // Launch browser with appropriate options
      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: executablePath,
        headless: 'new', // Use new headless mode
        ignoreHTTPSErrors: true,
      });
      
      const page = await browser.newPage();
      
      try {
        // Set content with basic options - keeping it simple for stability
        await page.setContent(renderedHtml, { 
          waitUntil: 'networkidle0',
          timeout: 30000
        });
        
        // Simple wait to ensure resources are loaded
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
        browser = null;
        
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
      } catch (innerError) {
        console.error('Error during PDF generation:', innerError);
        
        // Make sure browser is closed even on error
        try {
          if (browser) {
            await browser.close();
            browser = null;
          }
        } catch (closingError) {
          console.error('Error closing browser:', closingError);
        }
        
        // Fallback to HTML
        addLog('warning', 'PDF generation failed, falling back to HTML', { error: innerError.message });
        
        // Add a message to the HTML about the fallback
        const fallbackMessage = `
        <div style="background-color: #fff3cd; color: #856404; padding: 15px; margin-bottom: 20px; border: 1px solid #ffeeba; border-radius: 5px; text-align: center;">
          <h3>PDF Generation Failed</h3>
          <p>We were unable to generate a PDF due to technical limitations in the serverless environment.</p>
          <p>This HTML version is provided as a fallback. You can print this page to PDF using your browser's print function.</p>
          <p><small>Error: ${innerError.message}</small></p>
        </div>`;
        
        // Insert the message at the beginning of the HTML body
        const enhancedHtml = renderedHtml.replace('<body>', `<body>${fallbackMessage}`);
        
        // Send HTML as fallback
        res.contentType('text/html');
        res.send(enhancedHtml);
        
        // Still count as successful since we provided a response
        stats.successfulRequests++;
      }
    } catch (browserError) {
      console.error('Browser error:', browserError);
      
      // Make sure browser is closed even on error
      try {
        if (browser) {
          await browser.close();
          browser = null;
        }
      } catch (closingError) {
        console.error('Error closing browser:', closingError);
      }
      
      // Fallback to HTML if PDF generation fails
      addLog('warning', 'PDF generation failed, falling back to HTML', { error: browserError.message });
      
      // Add a message to the HTML about the fallback
      const fallbackMessage = `
      <div style="background-color: #fff3cd; color: #856404; padding: 15px; margin-bottom: 20px; border: 1px solid #ffeeba; border-radius: 5px; text-align: center;">
        <h3>PDF Generation Failed</h3>
        <p>We were unable to generate a PDF due to technical limitations in the serverless environment.</p>
        <p>This HTML version is provided as a fallback. You can print this page to PDF using your browser's print function.</p>
        <p><small>Error: ${browserError.message}</small></p>
      </div>`;
      
      // Insert the message at the beginning of the HTML body
      const enhancedHtml = renderedHtml.replace('<body>', `<body>${fallbackMessage}`);
      
      // Send HTML as fallback
      res.contentType('text/html');
      res.send(enhancedHtml);
      
      // Still count as successful since we provided a response
      stats.successfulRequests++;
    }
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
    // Check if data is in req.body directly or in req.body.json
    let data = req.body;
    if (req.body.json && typeof req.body.json === 'string') {
      try {
        data = JSON.parse(req.body.json);
      } catch (jsonError) {
        console.error('Error parsing JSON from form submission:', jsonError);
      }
    }
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    // Map new field names to expected field names
    if (data["Other Fees"] !== undefined) {
      data.Other_Fees = data["Other Fees"];
    }
    if (data.Bonus_Amount !== undefined) {
      data.Bonus = data.Bonus_Amount;
    }
    if (data.KPI_Deduction_Amount !== undefined) {
      data.Deduction = data.KPI_Deduction_Amount;
    }
    if (data.Remark !== undefined) {
      data.Notes = data.Remark;
    }
    if (data.Other_Remark !== undefined) {
      data.Other_Fees_Description = data.Other_Remark;
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

// HTML download route (returns HTML as a downloadable file)
app.post('/download-html', (req, res) => {
  try {
    // Check if data is in req.body directly or in req.body.json
    let data = req.body;
    if (req.body.json && typeof req.body.json === 'string') {
      try {
        data = JSON.parse(req.body.json);
      } catch (jsonError) {
        console.error('Error parsing JSON from form submission:', jsonError);
      }
    }
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    // Map new field names to expected field names
    if (data["Other Fees"] !== undefined) {
      data.Other_Fees = data["Other Fees"];
    }
    if (data.Bonus_Amount !== undefined) {
      data.Bonus = data.Bonus_Amount;
    }
    if (data.KPI_Deduction_Amount !== undefined) {
      data.Deduction = data.KPI_Deduction_Amount;
    }
    if (data.Remark !== undefined) {
      data.Notes = data.Remark;
    }
    if (data.Other_Remark !== undefined) {
      data.Other_Fees_Description = data.Other_Remark;
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
    
    // Send HTML as downloadable file
    res.setHeader('Content-disposition', 'attachment; filename=payslip.html');
    res.contentType('text/html');
    res.send(renderedHtml);
    
    addLog('info', 'HTML file downloaded');
    
  } catch (error) {
    console.error('Error generating HTML file:', error);
    addLog('error', 'Failed to generate HTML file', { error: error.message });
    res.status(500).json({ error: 'Failed to generate HTML file', details: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Payslip Generator API running on port ${port}`);
  console.log(`Dashboard available at http://localhost:${port}`);
}); 