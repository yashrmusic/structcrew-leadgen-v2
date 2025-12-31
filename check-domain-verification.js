#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs-extra');
const Handlebars = require('handlebars');

async function loadTemplate() {
    const templatePath = './templates/structcrew-clean.html';
    const templateContent = await fs.readFile(templatePath, 'utf8');
    return Handlebars.compile(templateContent);
}

async function checkDomainVerification() {
    console.log('🔍 CHECKING DOMAIN VERIFICATION\n');
    console.log('='.repeat(60));

    const apiKey = 're_RckePj7G_GXjdwEiNeiquvjEAav146kim';

    try {
        const response = await axios.get('https://api.resend.com/domains', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        const domains = response.data.data || [];
        const structcrewDomain = domains.find(d => d.name === 'structcrew.online');

        if (structcrewDomain) {
            console.log('✅ Domain found in Resend: structcrew.online');
            console.log(`   Status: ${structcrewDomain.status}\n`);

            if (structcrewDomain.status === 'verified') {
                console.log('🎉 Domain is VERIFIED! Ready to send emails!\n');
                return true;
            } else if (structcrewDomain.status === 'not_started') {
                console.log('⏸️  Domain not verified yet.\n');
                console.log('Next steps:');
                console.log('1. Add DNS records to Hostinger');
                console.log('   See: RESEND_CUSTOM_DOMAIN_SETUP.md\n');
                console.log('2. Wait for DNS propagation (10-30 min)');
                console.log('3. Verify in Resend Dashboard\n');
                console.log('Check progress at:');
                console.log('   https://resend.com/domains\n');
                return false;
            } else if (structcrewDomain.status === 'pending') {
                console.log('⏳ Domain verification pending...\n');
                console.log('DNS records added but not yet verified.');
                console.log('Wait 5-10 more minutes and try again.\n');
                return false;
            } else {
                console.log(`⚠️  Domain status: ${structcrewDomain.status}\n`);
                console.log('Check Resend Dashboard for details:');
                console.log('   https://resend.com/domains\n');
                return false;
            }
        } else {
            console.log('❌ Domain NOT found in Resend\n');
            console.log('Add domain first:');
            console.log('1. Go to: https://resend.com/domains');
            console.log('2. Click: "Add Domain"');
            console.log('3. Enter: structcrew.online\n');
            return false;
        }

    } catch (error) {
        console.log('❌ Error checking domain:', error.response?.data || error.message);
        return false;
    }
}

async function sendTestEmail() {
    console.log('📧 SENDING TEST EMAIL\n');
    console.log('='.repeat(60));

    const apiKey = 're_RckePj7G_GXjdwEiNeiquvjEAav146kim';

    try {
        const template = await loadTemplate();
        const htmlContent = template({
            to: 'structcrew@gmail.com',
            subject: 'Test Email - Resend Custom Domain',
            companyName: 'Test Architecture Firm',
            businessType: 'Architecture & Design',
            email: 'info@structcrew.online',
            phone: ''
        });

        const response = await axios.post('https://api.resend.com/emails', {
            from: 'StructCrew <info@structcrew.online>',
            to: ['structcrew@gmail.com'],
            subject: 'Test Email - Resend Custom Domain Working',
            html: htmlContent
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        if (response.data && response.data.id) {
            console.log('✅ Test email sent successfully!\n');
            console.log('Message ID:', response.data.id);
            console.log('From: info@structcrew.online');
            console.log('To: structcrew@gmail.com\n');
            console.log('🎉 Resend with custom domain is working!\n');
            console.log('Ready to send mass emails:\n');
            console.log('  node send-resend-mass.js\n');
            return true;
        } else {
            console.log('❌ Unexpected response:', response.data);
            return false;
        }

    } catch (error) {
        console.log('❌ Error sending test email:', error.response?.data || error.message);
        return false;
    }
}

async function main() {
    const isVerified = await checkDomainVerification();

    if (isVerified) {
        console.log('\n' + '='.repeat(60));
        console.log('Domain verified! Sending test email...\n');
        const testSent = await sendTestEmail();

        if (testSent) {
            console.log('\n' + '='.repeat(60));
            console.log('✅ ALL READY TO SEND MASS EMAILS!\n');
            console.log('Send 118 emails with:\n');
            console.log('  node send-resend-mass.js\n');
        }
    } else {
        console.log('\n' + '='.repeat(60));
        console.log('⏸️  WAITING FOR DOMAIN VERIFICATION\n');
        console.log('='.repeat(60));
        console.log('\nPlease complete these steps:\n');
        console.log('1. Add domain to Resend');
        console.log('   https://resend.com/domains\n');
        console.log('2. Add DNS records to Hostinger');
        console.log('   See: RESEND_CUSTOM_DOMAIN_SETUP.md\n');
        console.log('3. Wait 10-30 minutes for DNS propagation\n');
        console.log('4. Verify domain in Resend Dashboard\n');
        console.log('5. Run this command again to check status:\n');
        console.log('   node check-domain-verification.js\n');
        console.log('\n' + '='.repeat(60) + '\n');
    }
}

main().catch(error => {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
});
