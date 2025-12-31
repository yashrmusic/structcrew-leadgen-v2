const axios = require('axios');

async function testMailgunDirect() {
    console.log('🔫 TESTING MAILGUN API DIRECT\n');
    console.log('='.repeat(60));

    const apiKey = 'YOUR_MAILGUN_API_KEY';
    const domain = 'sandboxf7ab035db03547e0a804d2b438acb267.mailgun.org';

    console.log('API Key:', apiKey.substring(0, 30) + '...');
    console.log('Domain:', domain);

    try {
        const response = await axios.post(
            `https://api.mailgun.net/v3/${domain}/messages`,
            new URLSearchParams({
                from: 'StructCrew <structcrew@gmail.com>',
                to: 'structcrew@gmail.com',
                subject: 'Test Email - Mailgun API Working',
                text: 'This is a test email from StructCrew using Mailgun.',
                html: '<h1>Mailgun API Test</h1><p>This is a test email from StructCrew using Mailgun.</p>'
            }),
            {
                auth: {
                    username: 'api',
                    password: apiKey
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 30000
            }
        );

        if (response.data && response.data.id) {
            console.log('\n✅ SUCCESS! Mailgun API key is working!\n');
            console.log('Message ID:', response.data.id);
            console.log('From: structcrew@gmail.com');
            console.log('To: structcrew@gmail.com\n');
            console.log('🎉 Mailgun is ready to send mass emails!\n');
            console.log('Send 118 emails with:');
            console.log('  node run-mailgun-campaign.js\n');
            return true;
        } else {
            console.log('\n❌ Unexpected response:', JSON.stringify(response.data));
            return false;
        }

    } catch (error) {
        console.log('\n❌ Error:', error.response?.data || error.message);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('\n⚠️  API Key invalid or incorrect format.');
            console.log('\nCheck:');
            console.log('1. Go to: https://app.mailgun.com/app/dashboard');
            console.log('2. Click: "Sending" → "Domain settings" → "API Keys"');
            console.log('3. Make sure you copied the "Private API Key"');
            console.log('4. Key should NOT have hyphen in middle\n');
        }
        
        return false;
    }
}

testMailgunDirect().catch(error => {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
});
