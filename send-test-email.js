#!/usr/bin/env node

const EmailSender = require('./src/server/email-sender');

async function sendTestEmail() {
    const sender = new EmailSender();
    await sender.loadConfig();

    const testEmail = {
        email: 'structcrew@gmail.com',
        companyName: 'Test Architecture Firm',
        businessType: 'Architecture & Design'
    };

    const subject = 'Test Email - StructCrew Outreach Template';

    console.log('Sending test email to:', testEmail.email);
    console.log('Company:', testEmail.companyName);
    console.log('Business Type:', testEmail.businessType);
    console.log('Subject:', subject);
    console.log('');

    const result = await sender.sendEmail(
        testEmail.email,
        subject,
        '',
        {
            template: 'structcrew-clean',
            companyName: testEmail.companyName,
            businessType: testEmail.businessType
        }
    );

    if (result.success) {
        console.log('\n✅ Test email sent successfully!');
        console.log('Message ID:', result.messageId);
        console.log('\nCheck your inbox to verify the template looks correct.');
    } else {
        console.log('\n❌ Failed to send test email:', result.error);
        process.exit(1);
    }
}

sendTestEmail().catch(console.error);
