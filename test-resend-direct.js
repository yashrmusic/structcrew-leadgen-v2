const axios = require('axios');

async function testResendAPI() {
    console.log('🧪 TESTING RESEND API DIRECTLY\n');

    const apiKey = 're_RckePj7G_GXjdwEiNeiquvjEAav146kim';

    try {
        const response = await axios.post('https://api.resend.com/emails', {
            from: 'StructCrew <structcrew@gmail.com>',
            to: ['structcrew@gmail.com'],
            subject: 'Test Email - Resend API Working',
            html: '<h1>Resend API Test</h1><p>This is a test email from StructCrew.</p>'
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.id) {
            console.log('✅ SUCCESS! Resend API key is working!\n');
            console.log('Message ID:', response.data.id);
            console.log('From:', response.data.from);
            console.log('To:', response.data.to);
            console.log('\n🎉 Resend is ready to send mass emails!\n');
            console.log('Send 118 emails with:');
            console.log('  node run-resend-campaign.js\n');
            return true;
        } else {
            console.log('❌ Unexpected response:', response.data);
            return false;
        }

    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
        return false;
    }
}

testResendAPI();
