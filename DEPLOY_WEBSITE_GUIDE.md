# Deploy StructCrew Website to structcrew.online

## Current Domain Configuration

**Domain:** structcrew.online
**Nameservers:** ns1.dns-parking.com, ns2.dns-parking.com
**Current A Record:** 84.32.84.32 (needs to be changed)

---

## Quick Deploy to Netlify (Recommended)

### Step 1: Deploy Website to Netlify

1. **Sign Up/Login to Netlify**
   - Go to: https://app.netlify.com
   - Create free account if needed

2. **Deploy Your Website**
   - Drag and drop the `structcrew-website` folder to Netlify
   - Wait for deployment to complete (~30 seconds)
   - Your site will be live at: `https://random-name-12345.netlify.app`

3. **Note Your Netlify URL**
   - You'll see it in the top-left corner
   - Example: `https://structcrew-website-xyz.netlify.app`

### Step 2: Add Custom Domain in Netlify

1. **Go to Domain Settings**
   - In Netlify dashboard, click: **Domain Settings**

2. **Add Your Domain**
   - Click: **Add custom domain**
   - Enter: `structcrew.online`
   - Click: **Add domain**

3. **Add www Subdomain**
   - Click: **Add domain** again
   - Enter: `www.structcrew.online`
   - Click: **Add domain**

4. **Choose DNS Configuration**
   - Netlify will show you the recommended DNS settings
   - Note down the **IP address** Netlify provides
   - Usually: `75.2.70.75` or similar

### Step 3: Update DNS in Hostinger

1. **Log in to Hostinger**
   - Go to your Hostinger dashboard
   - Navigate to: **Domains** → **structcrew.online** → **Manage DNS records**

2. **DELETE Existing A Record**
   - Find the A record for `@` pointing to `84.32.84.32`
   - Delete it

3. **ADD New A Record**
   ```
   Type: A
   Name: @
   Points to: [Get from Netlify Domain Settings - e.g., 75.2.70.75]
   TTL: 3600
   ```

4. **UPDATE CNAME for www**
   - Find the existing CNAME for `www` pointing to `structcrew.online`
   - **Update** it to:
   ```
   Type: CNAME
   Name: www
   Points to: [your-netlify-subdomain].netlify.app
   TTL: 3600
   ```
   - Example: `structcrew-website-xyz.netlify.app`

5. **KEEP These Email Records** (do NOT delete):
   ```
   ✅ CNAME brevo1._domainkey → b1.structcrew-online.dkim.brevo.com
   ✅ CNAME brevo2._domainkey → b2.structcrew-online.dkim.brevo.com
   ✅ TXT _dmarc → v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com
   ✅ TXT brevo-code → 680f353f2fe75c0144df3777b4f6e518
   ```

### Step 4: Verify Deployment

1. **Wait for DNS Propagation**
   - DNS changes take 5-30 minutes to propagate
   - Sometimes up to 48 hours

2. **Test Your Website**
   ```bash
   curl -I http://structcrew.online
   curl -I http://www.structcrew.online
   ```

3. **Visit in Browser**
   - Open: https://structcrew.online
   - Open: https://www.structcrew.online

4. **Check Netlify Status**
   - Go to Netlify → Domain Settings
   - Verify both `structcrew.online` and `www.structcrew.online` show "Active"

### Step 5: Enable HTTPS (Free SSL)

1. **In Netlify**
   - Go to: Domain Settings → HTTPS
   - Click: **Enable automatic HTTPS**
   - Wait for SSL certificate to be issued (~1-2 minutes)

2. **Force HTTPS**
   - Enable: **Force HTTPS**
   - This redirects all HTTP to HTTPS

---

## Alternative: Deploy to Vercel

### Step 1: Deploy Website

```bash
cd structcrew-website
npm install -g vercel
vercel
```

### Step 2: Add Domain in Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to: **Settings** → **Domains**
4. Click: **Add** → Enter: `structcrew.online`
5. Click: **Add**

### Step 3: Update DNS in Hostinger

1. **DELETE Existing A Record** for `@`

2. **ADD These Records:**
   ```
   Type: CNAME
   Name: @
   Points to: cname.vercel-dns.com
   TTL: 3600
   
   Type: CNAME
   Name: www
   Points to: cname.vercel-dns.com
   TTL: 3600
   ```

3. **KEEP All Email Records** (same as Netlify)

---

## DNS Summary

### DELETE These Records:
```
Type: A
Name: @
Points to: 84.32.84.32
TTL: 50
```

### ADD These Records (Netlify):
```
Type: A
Name: @
Points to: [Netlify IP - e.g., 75.2.70.75]
TTL: 3600

Type: CNAME
Name: www
Points to: [your-netlify-site].netlify.app
TTL: 3600
```

### KEEP These Records (Email):
```
CNAME brevo1._domainkey → b1.structcrew-online.dkim.brevo.com
CNAME brevo2._domainkey → b2.structcrew-online.dkim.brevo.com
CNAME email → mailgun.org
TXT _dmarc → "v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com"
TXT brevo-code → "680f353f2fe75c0144df3777b4f6e518"
CAA @ → (keep all CAA records)
```

---

## Troubleshooting

### Website Not Loading

1. **Check DNS Propagation**
   ```bash
   dig structcrew.online
   dig www.structcrew.online
   ```

2. **Check Netlify Status**
   - Go to Netlify → Domain Settings
   - Check if domain shows "Active"

3. **Wait Longer**
   - DNS can take up to 48 hours
   - Usually it's 5-30 minutes

### HTTPS Not Working

1. Wait for SSL certificate to be issued (1-2 minutes)
2. Make sure DNS is propagated
3. Check Netlify: Domain Settings → HTTPS

### Email Not Working

1. Verify all Brevo DNS records are present
2. Check DNS propagation
3. Use a DNS checker tool: https://dnschecker.org

---

## Final Checklist

- [ ] Deployed website to Netlify/Vercel
- [ ] Added custom domain in Netlify/Vercel
- [ ] Deleted old A record (84.32.84.32)
- [ ] Added new A record pointing to Netlify/Vercel
- [ ] Updated CNAME for www
- [ ] Verified email DNS records are present
- [ ] Waited for DNS propagation
- [ ] Tested http://structcrew.online
- [ ] Tested http://www.structcrew.online
- [ ] Enabled HTTPS in Netlify/Vercel
- [ ] Tested https://structcrew.online
- [ ] Tested https://www.structcrew.online

---

## Support

- Netlify Support: https://www.netlify.com/support
- Hostinger Support: https://www.hostinger.com/support
- DNS Checker: https://dnschecker.org

---

## Quick Command Reference

```bash
# Deploy to Netlify (drag & drop in browser)

# Deploy to Vercel
cd structcrew-website
npm install -g vercel
vercel

# Check DNS propagation
dig structcrew.online
dig www.structcrew.online

# Test website
curl -I http://structcrew.online
curl -I http://www.structcrew.online

# Check SSL
curl -I https://structcrew.online
```

---

**Your website will be live at:**
- https://structcrew.online
- https://www.structcrew.online

**Contact form submissions will go to:** hello@structcrew.online
**WhatsApp:** +91 93129 43581

---

Good luck! 🚀