# 🧩 DNS VERIFICATION GUIDE FOR RESEND (HOSTINGER)

## ✅ BREVO API KEY CONFIGURED!

**Status**: ✅ **Brevo API key added and configured**
**Free Tier**: 300 emails/day
**Ready to use**: Yes!

---

## 🧪 TEST BREVO CONNECTION

Let me test the Brevo API key first:

```bash
node test-brevo.js
```

---

## 🧩 STEP-BY-STEP: VERIFY DNS FOR RESEND IN HOSTINGER

### Prerequisites:
- ✅ Resend API Key configured
- ✅ Custom domain: `structcrew.online`
- ✅ Hostinger account (where you bought the domain)

---

## STEP 1: ADD DOMAIN TO RESEND (2 minutes)

### 1.1 Login to Resend
Go to: https://resend.com/login
Enter your credentials and login

### 1.2 Navigate to Domains
1. Click on "Domains" in the left sidebar
2. Click on: "Add Domain" button

### 1.3 Enter Domain
1. Enter: `structcrew.online`
2. Click: "Add Domain"

### 1.4 DNS Records Appear
Resend will now show you the DNS records you need to add.

You'll see 3-4 records:
- TXT (Domain verification)
- TXT (SPF)
- CNAME (DKIM)
- MX (Mail Exchange)

**IMPORTANT**: Keep this tab open! You'll need these values.

---

## STEP 2: LOGIN TO HOSTINGER (1 minute)

### 2.1 Go to Hostinger
Go to: https://hpanel.hostinger.com
Login with your Hostinger credentials

### 2.2 Navigate to Domain Manager
1. Click on "Domains" in the top menu
2. Find: `structcrew.online` in your domains list
3. Click on: "Manage" button next to the domain

---

## STEP 3: MANAGE DNS RECORDS (1 minute)

### 3.1 Open DNS Manager
1. On the domain management page
2. Look for: "DNS / DNS Management" or "DNS Zone"
3. Click on it

You should now see your current DNS records (like A record, CNAME for www, etc.)

### 3.2 Add New DNS Records
You'll add 4 new records. Click: "Add New Record" for each one.

---

## STEP 4: ADD THE 4 DNS RECORDS (5 minutes)

### RECORD 1: TXT Record (SPF)

**Purpose**: Tells email providers which services are allowed to send emails

**Fill in:**
```
Type: TXT
Name: @
Content: v=spf1 include:resend.com ~all
TTL: 3600
```

**Click**: "Save" or "Add"

---

### RECORD 2: TXT Record (Domain Verification)

**Purpose**: Proves you own this domain

**Look at Resend Dashboard** (keep that tab open):
- Find the TXT record under "Domain Verification"
- It will look like: `resend._domainkey=some-random-string`

**Fill in:**
```
Type: TXT
Name: @
Content: resend._domainkey=[copy exact value from Resend]
TTL: 3600
```

**Example** (your values will be different):
```
Type: TXT
Name: @
Content: resend._domainkey=12345abcdef67890
TTL: 3600
```

**Click**: "Save" or "Add"

---

### RECORD 3: CNAME Record (DKIM)

**Purpose**: Provides email authentication

**Look at Resend Dashboard:**
- Find the CNAME record under "DKIM"
- It will show a host name and target

**Fill in:**
```
Type: CNAME
Name: resend._domainkey
Content: [copy exact value from Resend]
TTL: 300
```

**Example** (your values will be different):
```
Type: CNAME
Name: resend._domainkey
Content: sendgrid.net
TTL: 300
```

**Click**: "Save" or "Add"

---

### RECORD 4: MX Record (Mail Exchange)

**Purpose**: Tells where to send emails for this domain

**Look at Resend Dashboard:**
- Find the MX record
- It will show a mail server address

**Fill in:**
```
Type: MX
Name: @
Priority: 10
Content: mx.resend.com
TTL: 3600
```

**Click**: "Save" or "Add"

---

## STEP 5: VERIFY DNS RECORDS ADDED (1 minute)

After adding all 4 records:

1. Scroll down to see all DNS records
2. Make sure you see:
   - TXT (@) with SPF
   - TXT (@) with resend._domainkey
   - CNAME (resend._domainkey)
   - MX (@) pointing to mx.resend.com

**If all 4 records are there**, move to Step 6.

**If any are missing**, add them again.

---

## STEP 6: WAIT FOR DNS PROPAGATION (10-30 minutes)

### What is DNS Propagation?
DNS records take time to spread across the internet. This is called "propagation".

### How long?
- Usually: 10-30 minutes
- Sometimes: Up to 24 hours (rare)

### Can I check progress?

Yes! Go to: https://www.whatsmydns.net/

**Steps:**
1. Enter: `structcrew.online`
2. Click: "Search"
3. You'll see results from different DNS servers around the world
4. When all servers show your new records, propagation is complete

**What to look for:**
- TXT record with SPF should show: `v=spf1 include:resend.com ~all`
- TXT record with domainkey should show: `resend._domainkey=...`
- CNAME record should show the target from Resend
- MX record should show: `mx.resend.com`

---

## STEP 7: VERIFY DOMAIN IN RESEND (5 minutes)

### 7.1 Go Back to Resend Dashboard
Keep that Resend tab open, or go to:
https://resend.com/domains

### 7.2 Find Your Domain
Look for: `structcrew.online`

You'll see status options:
- "Not Started" - DNS records not added yet
- "Pending" - DNS records added, waiting for propagation
- "Verified" - All good!

### 7.3 Click "Verify"

If status is "Pending":
1. Click: "Verify" button
2. Wait 5-10 seconds
3. Page will refresh
4. Status should change to "✅ Verified"

If status shows error:
- Make sure all 4 DNS records are correct
- Check for typos (extra spaces, wrong values)
- Wait a bit more for propagation
- Try verifying again

---

## STEP 8: TEST EMAIL (1 minute)

Once domain is verified with green checkmark ✅:

### Run test command:
```bash
node test-resend.js
```

This will send a test email to: `structcrew@gmail.com`

If successful, you'll see:
```
✅ Test email sent successfully!
Message ID: [id]
```

If it fails, check the error message.

---

## STEP 9: SEND MASS EMAILS (10-15 minutes)

Once test email works:

### Run mass email command:
```bash
node send-resend-mass.js
```

This will:
- Send to all 118 emails
- Use template: `structcrew-clean.html`
- From: `info@structcrew.online`
- Track opens, clicks, bounces

---

## 📋 QUICK CHECKLIST

Before starting:
- [ ] Added domain to Resend Dashboard
- [ ] Copied DNS records from Resend
- [ ] Logged in to Hostinger
- [ ] Opened DNS Manager
- [ ] Added TXT (SPF) record
- [ ] Added TXT (domainkey) record
- [ ] Added CNAME (DKIM) record
- [ ] Added MX record
- [ ] Verified all 4 records in Hostinger
- [ ] Waited 10-30 minutes for propagation
- [ ] Checked: https://www.whatsmydns.net/
- [ ] Verified domain in Resend Dashboard
- [ ] Saw green checkmark ✅
- [ ] Sent test email
- [ ] Test email received successfully
- [ ] Ready to send mass emails

---

## 🔍 TROUBLESHOOTING

### Problem: "Domain verification failed"
**Solution**:
1. Check DNS records in Hostinger - make sure all 4 are there
2. Check for typos - verify exact values match Resend
3. Wait more time - DNS can take up to 30 minutes
4. Try verifying again in Resend

### Problem: "DNS propagation taking too long"
**Solution**:
1. Check with: https://www.whatsmydns.net/
2. If some servers show old records, wait longer
3. If all servers show new records, try verifying
4. Usually 10-30 minutes, sometimes up to 24 hours

### Problem: "Test email not received"
**Solution**:
1. Check spam folder
2. Verify domain is verified in Resend
3. Wait 5-10 minutes for email delivery
4. Check Resend Dashboard for errors

### Problem: "Can't find DNS Manager in Hostinger"
**Solution**:
1. Domains → Manage
2. Look for: "DNS", "DNS Management", "DNS Zone", "DNS Records"
3. If still can't find, contact Hostinger support

---

## 📞 SUPPORT

### Resend Support
- Documentation: https://resend.com/docs/domains
- DNS Records: https://resend.com/docs/dns-records
- Status Page: https://status.resend.com/
- Support Email: support@resend.com

### Hostinger Support
- DNS Guide: https://support.hostinger.com/en/articles/1696542-dns-management-in-hpanel
- Contact: https://support.hostinger.com/

### Check DNS Propagation
- https://www.whatsmydns.net/
- https://dnschecker.org/
- https://mxtoolbox.com/

---

## ✅ CURRENT STATUS

| Item | Status |
|------|--------|
| Brevo API Key | ✅ Configured |
| Resend API Key | ✅ Configured |
| Custom Domain | ✅ structcrew.online |
| Domain added to Resend | ❌ Need to add |
| DNS records added | ❌ Need to add |
| DNS propagated | ⏸️ Pending |
| Domain verified | ⏸️ Pending |
| Ready to send | ⏸️ Waiting for verification |

---

## 🎉 NEXT STEPS

1. **Add domain to Resend** (2 min)
   - https://resend.com/domains

2. **Add 4 DNS records** (5 min)
   - Follow steps above in Hostinger

3. **Wait for propagation** (10-30 min)
   - Check: https://www.whatsmydns.net/

4. **Verify in Resend** (5 min)
   - Click verify button
   - Wait for ✅ green checkmark

5. **Send 118 emails** (10-15 min)
   ```bash
   node send-resend-mass.js
   ```

---

**Total Time**: 32-62 minutes from start to sending emails

---

**Last Updated**: December 26, 2025
**Brevo Status**: ✅ Configured and ready
**Resend Status**: ⏳ Waiting for DNS verification
