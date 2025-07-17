# Payslip Generator Web App

A web application that generates PDF payslips from JSON data, designed to work with n8n workflow automation.

## Features

- Generates PDF payslips from JSON data
- Provides HTML preview for testing
- Dashboard with statistics and logs
- API documentation
- Designed to integrate with n8n workflow automation

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone this repository or download the source code:

```bash
git clone <repository-url>
cd payslip-generator
```

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

The server will start on port 3000 by default. You can change this by setting the `PORT` environment variable.

## Usage

### Dashboard

Access the dashboard at `http://localhost:3000/` to:

- View statistics
- See recent logs
- Test the PDF generation
- Access API documentation
- Preview the template

### API Endpoints

#### Generate PDF

```
POST /generate-pdf
```

Generates a PDF payslip from the provided JSON data.

**Request:**
- Content-Type: application/json
- Body: JSON object with payslip data

**Response:**
- Content-Type: application/pdf
- Body: PDF file

**Example with cURL:**

```bash
curl -X POST http://localhost:3000/generate-pdf \
  -H "Content-Type: application/json" \
  -d @sample_data.json \
  --output payslip.pdf
```

#### Preview HTML

```
POST /preview
```

Returns HTML preview of the payslip instead of a PDF.

**Request:**
- Content-Type: application/json
- Body: JSON object with payslip data

**Response:**
- Content-Type: text/html
- Body: HTML content

## Integration with n8n

To use this service with n8n workflow automation:

1. Add an **HTTP Request** node to your workflow
2. Set the method to **POST**
3. Set the URL to `http://your-server:3000/generate-pdf`
4. Set "Send Binary Data" to **false**
5. Set "Response Format" to **File**
6. In "JSON/RAW Parameters" provide your payslip data

### Example n8n Configuration

```json
{
  "url": "http://localhost:3000/generate-pdf",
  "method": "POST",
  "authentication": "none",
  "sendBinaryData": false,
  "responseFormat": "file",
  "options": {},
  "jsonParameters": true,
  "body": {
    "Sales_Name": "{{$node[\"Previous Node\"].json.firstName}}",
    "Sales_Last_Name": "{{$node[\"Previous Node\"].json.lastName}}",
    "Position": "{{$node[\"Previous Node\"].json.position}}",
    "Payout_Date": "{{$node[\"Previous Node\"].json.payoutDate}}",
    "Company_Name_Address": "{{$node[\"Previous Node\"].json.companyAddress}}",
    "Bank_Account": "{{$node[\"Previous Node\"].json.bankName}}",
    "Account_Number": "{{$node[\"Previous Node\"].json.accountNumber}}",
    "Case_Items": "{{$node[\"Previous Node\"].json.cases}}",
    "Other_Fees_Description": "{{$node[\"Previous Node\"].json.feesDescription}}",
    "Other_Fees": "{{$node[\"Previous Node\"].json.fees}}",
    "Bonus_Remark": "{{$node[\"Previous Node\"].json.bonusRemark}}",
    "Bonus": "{{$node[\"Previous Node\"].json.bonus}}",
    "Deduction_Remark": "{{$node[\"Previous Node\"].json.deductionRemark}}",
    "Deduction": "{{$node[\"Previous Node\"].json.deduction}}",
    "Withholding_Tax": "{{$node[\"Previous Node\"].json.withholdingTax}}",
    "Notes": "{{$node[\"Previous Node\"].json.notes}}",
    "Subtotal": "{{$node[\"Previous Node\"].json.subtotal}}",
    "Net_Pay": "{{$node[\"Previous Node\"].json.netPay}}"
  }
}
```

## Data Format

The API expects a JSON object with the following structure:

```json
{
  "Sales_Name": "John",
  "Sales_Last_Name": "Doe",
  "Position": "Sales Agent",
  "Payout_Date": "30/06/2023",
  "Company_Name_Address": "HOME Real Estate Services\n1104/293 Phattanakan Rd,\nSuanlaung, Bangkok 10250",
  "Bank_Account": "Kasikorn Bank",
  "Account_Number": "035-8-09258-6",
  "Case_Items": [
    {
      "index": 1,
      "Case_Details": "บ้านกลางเมือง รามอินทรา 83 สเตชั่น",
      "Commission": "231,000.00",
      "Commission_After_VAT": "215,887.85",
      "Payout_Percentage": "50.00%",
      "Net_Receive": "107,943.93"
    }
  ],
  "Other_Fees_Description": "Processing Fee",
  "Other_Fees": "-500.00",
  "Bonus_Remark": "โบนัส ค่ากรรมที่ดิน",
  "Bonus": "1,500.00",
  "Deduction_Remark": "หักค่าธรรมเนียมธนาคาร",
  "Deduction": "-300.00",
  "Withholding_Tax": "-1,200.00",
  "Notes": "KPI Mar 42% (Mar 80-42=38%)\nKPI Apr 68% (Apr 80-68=12%)\nKPI May 79.8% (May 80-79.8=0.2%)\n= 38+12+0.2 = 50.5%",
  "Subtotal": "138,453.27",
  "Net_Pay": "137,953.27"
}
```

## Deployment

### Local Development

For local development, you can use:

```bash
npm run dev
```

This will start the server with nodemon, which will automatically restart when you make changes.

### Production Deployment

#### Deploying to Render.com

This application is configured to work properly on Render.com using Docker:

1. **Create a new Web Service on Render**:
   - Sign in to your Render account
   - Click "New" and select "Web Service"
   - Connect your repository or use the "Deploy from GitHub" option

2. **Configure the Web Service**:
   - Select "Docker" as the Runtime
   - Set the name for your service (e.g., "payslip-generator")
   - Choose the branch to deploy from
   - Select the appropriate instance type (at least 512MB RAM recommended)
   - Click "Create Web Service"

3. **Environment Variables** (optional):
   - You can set environment variables in the Render dashboard if needed
   - No additional environment variables are required for basic functionality

4. **Access Your Deployed Application**:
   - Once deployed, Render will provide a URL for your application
   - Access the dashboard at the root URL
   - Use the `/generate-pdf` endpoint for your n8n integration

5. **Important: Service Type Selection**:
   - For reliable PDF generation, use a **paid plan** with at least 1GB RAM
   - Free tier services will go to sleep after inactivity and cause 503 errors
   - Consider upgrading to a "Standard" or "Pro" plan for production use

6. **Troubleshooting**:
   - If you encounter issues, check the logs in the Render dashboard
   - Ensure your repository includes all files (app.js, Dockerfile, package.json, etc.)

#### Deploying to Vercel

This application is also configured to work on Vercel:

1. **Deploy to Vercel**:
   - Connect your repository to Vercel
   - Use the provided vercel.json configuration

2. **Configuration**:
   - The vercel.json file includes settings for memory (3008MB) and timeout (120s)
   - These settings help prevent PDF generation failures

3. **Limitations**:
   - Vercel has a serverless architecture which may cause cold start issues
   - PDF generation is resource-intensive and may occasionally fail
   - For production use, consider a Docker-based deployment instead

#### Other Deployment Options

1. **Docker:**

```bash
docker build -t payslip-generator .
docker run -p 3000:3000 payslip-generator
```

2. **PM2:**

```bash
npm install -g pm2
pm2 start app.js --name payslip-generator
```

## Troubleshooting

### 503 Service Unavailable Errors

If you encounter 503 errors when using the application:

1. **Service Sleeping**: Free-tier services on platforms like Render and Vercel go to sleep after periods of inactivity. When this happens:
   - The first request after inactivity will wake up the service but may time out
   - Simply refresh the page or retry the request after a few seconds
   - For production use, upgrade to a paid plan that doesn't sleep

2. **Keep-Alive Solution**: To prevent the service from sleeping, you can set up a scheduled task to ping your service every 5-10 minutes:
   ```bash
   # Example cron job to ping service every 10 minutes
   */10 * * * * curl -s https://your-service-url.com/ > /dev/null
   ```

3. **Resource Limitations**: If you're on a paid plan but still experiencing 503 errors:
   - Check if your service has enough memory (minimum 1GB recommended)
   - Increase the timeout settings in your deployment configuration
   - Check the logs for specific error messages

### PDF Generation Issues

If the service returns HTML instead of a PDF:

1. **Chrome Installation**: The error "Chromium executable path not found" indicates that Chrome is not properly installed or accessible:
   - Ensure your deployment platform supports Docker for proper Chrome installation
   - Check that the Dockerfile is correctly configured to install Chrome
   - Verify that the PUPPETEER_EXECUTABLE_PATH environment variable is set correctly

2. **Memory Issues**: PDF generation requires significant memory:
   - Increase the memory allocation in your deployment configuration
   - For Vercel, check the vercel.json file (currently set to 3008MB)
   - For Render, upgrade to a plan with at least 1GB RAM

3. **Timeout Issues**: PDF generation can take time:
   - Increase the timeout settings in your deployment configuration
   - For Vercel, check the maxDuration in vercel.json (currently set to 120s)
   - For n8n HTTP Request nodes, increase the "Timeout" setting

4. **n8n Configuration**:
   - Ensure your n8n HTTP Request node has "Response Format" set to "File"
   - Check that the "Binary Property" is set to "data"
   - If the PDF still returns as HTML, you can use a "Move Binary Data" node to save the HTML file, then convert it to PDF using your browser's print function

## License

MIT 