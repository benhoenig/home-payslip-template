# Home Payslip Template

A clean, responsive HTML template for generating commission payslips.

## Features

- Clean, modern design with responsive layout
- Compatible with automation tools like n8n
- Supports dynamic data insertion via Mustache/Handlebars templates
- Print-ready with A4 page formatting
- Thai language support

## Usage

1. Use this template with automation tools that support HTML templates
2. Pass the required data variables to populate the template
3. Generate a PDF or PNG output for distribution

## Template Variables

The template uses the following variables:

- `Sales_Name`, `Sales_Last_Name` - Name of the sales person
- `Payout_Date` - Date of payment
- `Bank_Account` - Bank name
- `Account_Number` - Account number
- `Company_Name_Address` - Company information
- `Case_Items` - Array of commission items with properties:
  - `index` - Item number
  - `Case_Details` - Description
  - `Commission` - Commission amount
  - `Commission_After_VAT` - Amount after VAT
  - `Payout_Percentage` - Percentage to pay
  - `Net_Receive` - Net amount
- `Other_Fees_Description` - Description of additional fees
- `Other_Fees` - Amount of additional fees
- `Bonus_Deduction_Remark` - Description of bonus or deduction
- `Bonus_Deduction` - Amount of bonus or deduction
- `Notes` - Additional notes
- `Subtotal` - Subtotal amount
- `Net_Pay` - Final payment amount

## Files

- `payslip_template.html`: The main HTML template with placeholders
- `sample_data.json`: Sample data structure to populate the template
- `preview.html`: A preview page to see how the template looks with sample data

## Template Placeholders

The template uses the following placeholders that can be replaced with actual data:

### Personal Information
- `{{Sales_Name}}`: First name of the sales person
- `{{Sales_Last_Name}}`: Last name of the sales person
- `{{Payout_Date}}`: Date of the payout
- `{{Bank_Account}}`: Bank name
- `{{Account_Number}}`: Bank account number

### Company Information
- `{{Company_Name_Address}}`: Company name and address (supports line breaks with \n)

### Case Details
The template supports multiple cases using the `{{#Case_Items}}` Mustache loop:
- `{{index}}`: Case number
- `{{Case_Details}}`: Description of the case
- `{{Commission}}`: Commission amount
- `{{Commission_After_VAT}}`: Commission amount after VAT
- `{{Payout_Percentage}}`: Percentage of commission to be paid
- `{{Net_Receive}}`: Net amount received for this case

### Additional Fees and Bonuses
- `{{Other_Fees_Description}}`: Description of other fees
- `{{Other_Fees}}`: Amount of other fees
- `{{Bonus_Deduction_Remark}}`: Description of bonus or deduction
- `{{Bonus_Deduction}}`: Amount of bonus or deduction

### Summary Information
- `{{Notes}}`: Additional notes (supports line breaks with \n)
- `{{Subtotal}}`: Subtotal amount
- `{{Net_Pay}}`: Final net payment amount

## Using with n8n

To use this template with n8n:

1. Create a new workflow in n8n
2. Add a trigger node (e.g., HTTP Request, Webhook, or Manual Trigger)
3. Add a "Read Binary File" node to read the HTML template
4. Add a "Function" node to prepare your data
5. Add a "Mustache" node:
   - Connect it to both the "Read Binary File" and "Function" nodes
   - Set "Property Name" to the binary property containing the template
   - Set "Data Property" to the data output from your Function node
6. Add an "HTTP Request" node to send the generated HTML to a PDF generation service or directly to the client

### Example Function Node Code

```javascript
return {
  json: {
    // Your data structure matching sample_data.json
    Sales_Name: items[0].json.salesData.firstName,
    Sales_Last_Name: items[0].json.salesData.lastName,
    // ... other fields
    Case_Items: items[0].json.cases.map((c, i) => ({
      index: i + 1,
      Case_Details: c.description,
      // ... other case fields
    }))
    // ... summary fields
  }
};
```

## Customization

You can customize the template by:

1. Changing the CSS styles in the `<style>` section
2. Modifying the HTML structure to add or remove fields
3. Updating the placeholder names to match your data structure

## Logo Replacement

Replace the placeholder logo URL:
```html
<img src="https://via.placeholder.com/120x60?text=LOGO" alt="Company Logo" class="logo">
```

With your actual logo URL or a base64 encoded image.

## Previewing the Template

To preview how the template looks with the sample data:

1. Start a local web server:
   ```
   python -m http.server 8000
   ```
   or any other web server of your choice

2. Open a browser and navigate to:
   ```
   http://localhost:8000/preview.html
   ```

3. The preview page will automatically load the template with the sample data
4. You can use the "Print Preview" button to see how it would look when printed 