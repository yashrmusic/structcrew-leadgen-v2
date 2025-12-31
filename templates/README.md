# StructCrew Email Templates

This directory contains professional, responsive email templates for StructCrew recruitment campaigns.

## Templates

### 1. `modern.html` ⭐ Recommended
- **Best for**: Initial outreach to architecture/design firms
- **Features**:
  - Dark gradient theme with modern design
  - WhatsApp CTA for instant response
  - Mobile-optimized responsive layout
  - Tested across all major email clients
- **Conversion rate**: Highest among all templates
- **Use case**: First contact with new leads

### 2. `intro.html`
- **Best for**: Introduction campaigns
- **Features**:
  - Professional purple gradient header
  - Clear value proposition
  - Multiple benefit points
  - Clean, readable layout
- **Use case**: Detailed introduction to StructCrew services

### 3. `outreach.html`
- **Best for**: Direct partnership outreach
- **Features**:
  - Services grid layout
  - Professional modern design
  - Strong call-to-action section
  - Company focus
- **Use case**: B2B partnership proposals

### 4. `recruitment.html`
- **Best for**: WhatsApp-first campaigns
- **Features**:
  - Premium dark theme
  - WhatsApp + Instagram CTAs
  - WhatsApp: +91-9312943581
  - Instagram: @structcrew
- **Use case**: Social media driven recruitment

## Usage

Send with modern template:
```bash
node ../email-campaign.js send \
  --subject "Partnership Opportunity" \
  --emails ../test_emails.txt \
  --template modern
```

Send from Google Sheets:
```bash
node ../email-campaign.js send \
  --subject "Architecture Opportunities" \
  --google-sheets SHEET_ID \
  --creds ../google-credentials.json \
  --template modern
```

## Template Variables

All templates support these Handlebars variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{to}}` | Recipient email | test@company.com |
| `{{subject}}` | Email subject line | Partnership Opportunity |
| `{{companyName}}` | Company name (extracted from email) | Studio Design |
| `{{businessType}}` | Business type | Architecture Studio |
| `{{email}}` | Lead email | lead@company.com |
| `{{phone}}` | Lead phone number | +91-9876543210 |

## Customization

To customize templates:

1. Edit the HTML file directly
2. Keep Handlebars variables for dynamic content
3. Test changes with dry-run mode
4. Inline CSS before production (recommended for delivery)

### Adding Custom Variables

Add new variables to template:
```html
<p>Custom value: {{customVariable}}</p>
```

Then send with options:
```bash
node ../email-campaign.js send \
  --template modern \
  --customVariable "My Value"
```

## Best Practices

1. **Subject Lines**: Keep under 50 characters
2. **Preheader**: Add invisible preheader text for preview
3. **Mobile First**: Test on mobile devices
4. **Inlining**: Use CSS inliner tool for best compatibility
5. **Testing**: Always dry-run before full campaign

## Testing

Preview template locally:
```bash
node -e "
const Handlebars = require('handlebars');
const fs = require('fs');
const template = fs.readFileSync('modern.html', 'utf8');
const compiled = Handlebars.compile(template);
fs.writeFileSync('preview.html', compiled({to: 'test@example.com', subject: 'Test'}));
"
```

Open `preview.html` in browser to see rendered email.

## Troubleshooting

**Template not loading**: Ensure file exists in `templates/` directory
**Variables not rendering**: Check Handlebars syntax (double braces `{{ }}`)
**Styles not showing**: Some email clients strip `<style>` tags - inline CSS needed
**Images broken**: Use absolute URLs, add alt text and dimensions

## Resources

- [Email CSS Inliner](https://htmlemail.io/inline/)
- [Email on Acid Testing](https://www.emailonacid.com/)
- [Litmus Testing](https://litmus.com/)
- [HTML Email Guide](https://www.smashingmagazine.com/2017/01/introduction-building-sending-html-email-for-web-developers/)