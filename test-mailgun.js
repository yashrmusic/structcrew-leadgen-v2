const formData = require('form-data');
const Mailgun = require('mailgun.js');

async function testMailgun() {
    console.log('🔫 TESTING MAILGUN API KEY\n');
    console.log('='.repeat(60));

    const apiKey = 'YOUR_MAILGUN_API_KEY';
    const domain = 'sandboxf7ab035db03547e0a804d2b438acb267.mailgun.org';

    console.log('✅ Mailgun API Key configured');
    console.log(`   API Key: ${apiKey.substring(0, 30)}...`);
    console.log(`   Domain: ${domain}`);
    console.log(`   From Email: structcrew@gmail.com\n`);

    console.log('Sending test email to: structcrew@gmail.com\n');

    try {
        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({
            username: 'api',
            key: apiKey
        });

        const response = await mg.messages.create(domain, {
            from: 'StructCrew <structcrew@gmail.com>',
            to: ['structcrew@gmail.com'],
            subject: 'Test Email - Mailgun API Working',
            text: 'This is a test email from StructCrew using Mailgun.',
            html: '<h1>Mailgun API Test</h1><p>This is a test email from StructCrew using Mailgun.</p><p>Test successful!</p>'
        });

        if (response && response.id) {
            console.log('\n✅ SUCCESS! Mailgun API key is working!\n');
            console.log('Message ID:', response.id);
            console.log('From: StructCrew <structcrew@gmail.com>');
            console.log('To: structcrew@gmail.com\n');
            console.log('🎉 Mailgun is ready to send mass emails!\n');
            console.log('Benefits:');
            console.log('  ✅ 5,000 free emails/month (~166/day)');
            console.log('  ✅ 85-90% delivery rate');
            console.log('  ✅ Works with Gmail from address');
            console.log('  ✅ Real-time analytics\n');
            console.log('Send 118 emails with:');
            console.log('  node run-mailgun-campaign.js\n');
            return true;
        } else {
            console.log('\n❌ Unexpected response:', JSON.stringify(response));
            return false;
        }

    } catch (error) {
        console.log('\n❌ Error:', error.message);
        
        if (error.message.includes('401') || error.message.includes('403') || error.message.includes('unauthorized')) {
            console.log('\n⚠️  API Key invalid. Please check:\n');
            console.log('1. Go to: https://app.mailgun.com/app/dashboard');
            console.log('2. Verify the API key\n');
        }
        
        return false;
    }
}

testMailgun().catch(error => {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
});
