# Custom Domain Setup Guide

## 🌐 Domain Options for RuralConnect AI

You have several options to get a custom domain like `ruralconnect-ai.com` or similar.

---

## Option 1: Register Domain via AWS Route 53 (Recommended)

### Available Domain Extensions
- `ruralconnect-ai.com` - $13/year
- `ruralconnect-ai.in` - $9/year (India-specific)
- `ruralconnect-ai.org` - $12/year
- `ruralconnect-ai.app` - $18/year
- `ruralconnect.ai` - $60/year (.ai domains are premium)

### Steps to Register

1. **Check Domain Availability**
   ```bash
   aws route53domains check-domain-availability \
     --domain-name ruralconnect-ai.com \
     --region us-east-1
   ```

2. **Register Domain** (Example for .com)
   ```bash
   aws route53domains register-domain \
     --region us-east-1 \
     --domain-name ruralconnect-ai.com \
     --duration-in-years 1 \
     --admin-contact file://contact.json \
     --registrant-contact file://contact.json \
     --tech-contact file://contact.json \
     --privacy-protect-admin-contact \
     --privacy-protect-registrant-contact \
     --privacy-protect-tech-contact \
     --auto-renew
   ```

3. **Wait for Registration** (10-30 minutes)

---

## Option 2: Use Existing Domain from Other Registrar

If you already own a domain (GoDaddy, Namecheap, etc.):

1. **Create Hosted Zone in Route 53**
2. **Update Nameservers** at your registrar
3. **Configure DNS records**

---

## Option 3: Free Subdomain Options

### Using AWS Amplify Domain
- Get: `ruralconnect-ai.amplifyapp.com`
- Free, instant setup
- Limited customization

### Using Vercel/Netlify
- Get: `ruralconnect-ai.vercel.app`
- Free, instant setup
- Easy deployment

---

## Recommended: Register ruralconnect-ai.in

Since this is for rural India, I recommend `.in` domain:

### Domain: `ruralconnect-ai.in`
- **Cost:** ~$9/year
- **Relevance:** India-specific TLD
- **Trust:** Recognized by Indian users
- **SEO:** Better for Indian search results

---

## Quick Setup Script

I can help you register the domain automatically. Here's what we'll do:

### Step 1: Create Contact Information File

```json
{
  "FirstName": "Your Name",
  "LastName": "Last Name",
  "ContactType": "PERSON",
  "OrganizationName": "RuralConnect AI",
  "AddressLine1": "Your Address",
  "City": "Your City",
  "State": "Your State",
  "CountryCode": "IN",
  "ZipCode": "123456",
  "PhoneNumber": "+91.9876543210",
  "Email": "your-email@example.com"
}
```

### Step 2: Register Domain

```bash
# Check availability
aws route53domains check-domain-availability \
  --domain-name ruralconnect-ai.in \
  --region us-east-1

# Register (if available)
aws route53domains register-domain \
  --region us-east-1 \
  --domain-name ruralconnect-ai.in \
  --duration-in-years 1 \
  --admin-contact file://contact.json \
  --registrant-contact file://contact.json \
  --tech-contact file://contact.json \
  --privacy-protect-admin-contact \
  --privacy-protect-registrant-contact \
  --privacy-protect-tech-contact \
  --auto-renew
```

### Step 3: Request SSL Certificate

```bash
aws acm request-certificate \
  --domain-name ruralconnect-ai.in \
  --subject-alternative-names "*.ruralconnect-ai.in" \
  --validation-method DNS \
  --region us-east-1
```

### Step 4: Update CloudFront Distribution

```bash
# Get certificate ARN
CERT_ARN=$(aws acm list-certificates \
  --region us-east-1 \
  --query 'CertificateSummaryList[?DomainName==`ruralconnect-ai.in`].CertificateArn' \
  --output text)

# Update CloudFront with custom domain
aws cloudfront update-distribution \
  --id E3QXY9JKAZ57LV \
  --distribution-config file://cloudfront-custom-domain.json
```

### Step 5: Create DNS Records

```bash
# Create A record pointing to CloudFront
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch file://dns-records.json
```

---

## Alternative: Use Free Subdomain (Fastest)

If you want something quick and free, we can use:

### CloudFlare Pages
- Domain: `ruralconnect-ai.pages.dev`
- Free, instant
- Custom domain support later

### GitHub Pages
- Domain: `ruralconnect-ai.github.io`
- Free, instant
- Easy setup

---

## Cost Comparison

| Option | Domain | Cost/Year | Setup Time |
|--------|--------|-----------|------------|
| Route 53 (.in) | ruralconnect-ai.in | $9 | 30 min |
| Route 53 (.com) | ruralconnect-ai.com | $13 | 30 min |
| Route 53 (.org) | ruralconnect-ai.org | $12 | 30 min |
| Route 53 (.app) | ruralconnect-ai.app | $18 | 30 min |
| CloudFlare Pages | *.pages.dev | Free | 5 min |
| Vercel | *.vercel.app | Free | 5 min |

---

## My Recommendation

### For Production (Best)
**Register: `ruralconnect-ai.in`**
- Professional
- India-specific
- Affordable ($9/year)
- Full control

### For Quick Testing (Free)
**Use: CloudFront URL**
- Already working
- No cost
- Can add custom domain later

---

## What Would You Like?

**Option A:** Register `ruralconnect-ai.in` ($9/year)
- I'll need your contact information
- Takes 30 minutes to set up
- Professional domain

**Option B:** Register `ruralconnect-ai.com` ($13/year)
- More universal
- Takes 30 minutes to set up
- Professional domain

**Option C:** Use free subdomain
- Instant setup
- No cost
- Less professional

**Option D:** Keep CloudFront URL for now
- Already working
- Add custom domain later
- No additional cost

---

## Next Steps

Let me know which option you prefer, and I'll help you set it up!

If you choose Option A or B, please provide:
1. Your name
2. Email address
3. Phone number
4. Address (for domain registration)

---

*Note: Domain registration requires valid contact information and payment method in AWS account.*
