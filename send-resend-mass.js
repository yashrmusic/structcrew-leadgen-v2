const axios = require('axios');
const fs = require('fs-extra');
const Handlebars = require('handlebars');

async function loadTemplate() {
    const templatePath = './templates/structcrew-clean.html';
    const templateContent = await fs.readFile(templatePath, 'utf8');
    return Handlebars.compile(templateContent);
}

async function sendMassEmailsWithResend() {
    console.log('🚀 SENDING MASS EMAILS WITH RESEND\n');
    console.log('='.repeat(60));

    const apiKey = 're_RckePj7G_GXjdwEiNeiquvjEAav146kim';

    // Load emails
    const emailFile = 'final_email_list.txt';
    const content = await fs.readFile(emailFile, 'utf8');
    const emails = content.split('\n').filter(e => e.trim() && e.includes('@'));

    console.log(`📧 Total emails to send: ${emails.length}\n`);

    // Load template
    const template = await loadTemplate();

    const subject = 'Connect with StructCrew - Architecture & Design Recruitment';
    const fromEmail = 'structcrew@gmail.com';

    let sent = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < emails.length; i++) {
        const email = emails[i].trim();
        const progress = Math.round(((i + 1) / emails.length) * 100);

        try {
            const htmlContent = template({
                to: email,
                subject: subject,
                companyName: '',
                businessType: 'Architecture & Design',
                email: email,
                phone: ''
            });

            const response = await axios.post('https://api.resend.com/emails', {
                from: `StructCrew <${fromEmail}>`,
                to: [email],
                subject: subject,
                html: htmlContent
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            if (response.data && response.data.id) {
                sent++;
                console.log(`[${progress}%] ✅ Sent to ${email} [${response.data.id.substring(0, 15)}...]`);
            } else {
                failed++;
                console.log(`[${progress}%] ❌ Failed: ${email} (No message ID)`);
                errors.push({ email, error: 'No message ID' });
            }

        } catch (error) {
            failed++;
            const errorMsg = error.response?.data?.message || error.message;
            console.log(`[${progress}%] ❌ Failed: ${email}`);
            console.log(`   Error: ${errorMsg}`);
            errors.push({ email, error: errorMsg });

            // If it's a domain verification error, ask user if they want to continue
            if (errorMsg.includes('domain is not verified') || errorMsg.includes('validation_error')) {
                console.log('\n⚠️  Domain verification error detected.');
                console.log('Resend requires a verified domain (not Gmail).\n');
                console.log('Options:');
                console.log('1. Get a custom domain (e.g., structcrew.com)');
                console.log('2. Use Mailgun instead (allows Gmail)');
                console.log('3. Use Gmail directly (already configured)\n');
                break;
            }
        }

        // Delay between emails (5 seconds)
        if (i < emails.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 CAMPAIGN RESULTS');
    console.log('='.repeat(60));
    console.log(`\n✅ Sent: ${sent}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${sent > 0 ? ((sent / emails.length) * 100).toFixed(1) : 0}%\n`);

    if (errors.length > 0 && errors.length < 10) {
        console.log('Failed Emails:');
        errors.forEach(e => {
            console.log(`  - ${e.email}: ${e.error}`);
        });
    } else if (errors.length >= 10) {
        console.log(`\n${errors.length} emails failed. First 10 errors:`);
        errors.slice(0, 10).forEach(e => {
            console.log(`  - ${e.email}: ${e.error}`);
        });
    }

    console.log('\n' + '='.repeat(60));

    if (sent > 0) {
        console.log('\n🎉 Some emails sent successfully!');
        console.log('Track them here: https://resend.com/dashboard\n');
    } else {
        console.log('\n❌ No emails sent.');
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('\n1. Use Mailgun (allows Gmail from address):');
        console.log('   node quick-setup-mailgun.js\n');
        console.log('2. Or use Gmail directly (already working):');
        console.log('   node email-campaign.js send -s "Subject" -t structcrew-clean -e final_email_list.txt --limit 118\n');
        console.log('3. For Resend, get a custom domain first.\n');
    }
}

sendMassEmailsWithResend().catch(error => {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
});
