const axios = require('axios');
const fs = require('fs-extra');
const Handlebars = require('handlebars');

async function loadTemplate() {
    const templatePath = './templates/structcrew-clean.html';
    const templateContent = await fs.readFile(templatePath, 'utf8');
    return Handlebars.compile(templateContent);
}

async function sendMassEmailsWithBrevo() {
    console.log('🚀 SENDING MASS EMAILS WITH BREVO\n');
    console.log('='.repeat(60));

    const apiKey = 'YOUR_BREVO_API_KEY';

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

            const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
                sender: {
                    name: 'StructCrew',
                    email: fromEmail
                },
                to: [{
                    email: email
                }],
                subject: subject,
                htmlContent: htmlContent
            }, {
                headers: {
                    'api-key': apiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000
            });

            if (response.data && (response.data.messageId || response.data.messageId)) {
                sent++;
                const messageId = response.data.messageId || response.data.messageId;
                console.log(`[${progress}%] ✅ Sent to ${email} [${messageId.substring(0, 15)}...]`);
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
        console.log('\n🎉 Emails sent successfully!');
        console.log('Track them here: https://app.brevo.com/campaigns\n');
    } else {
        console.log('\n❌ No emails sent.');
        console.log('\n💡 OPTIONS:');
        console.log('\n1. Try again');
        console.log('   node send-brevo-mass.js\n');
        console.log('\n2. Use Gmail instead (already working)');
        console.log('   node email-campaign.js send -s "Subject" -t structcrew-clean -e final_email_list.txt --limit 118\n');
        console.log('\n3. Setup Resend for high delivery');
        console.log('   See: DNS_VERIFICATION_GUIDE.md\n');
    }
}

sendMassEmailsWithBrevo().catch(error => {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
});
