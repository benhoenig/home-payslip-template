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

For production deployment, you can use:

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

3. **Cloud Platforms:**
   - Deploy to Heroku, Vercel, AWS, etc. following their respective deployment guides.

## License

MIT 