#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs-extra');
const Handlebars = require('handlebars');

async function loadTemplate() {
    const templatePath = './templates/structcrew-clean.html';
    const templateContent = await fs.readFile(templatePath, 'utf8');
    return Handlebars.compile(templateContent);
}

async function testBrevo() {
    console.log('🧪 TESTING BREVO API KEY\n');
    console.log('='.repeat(60));

    const apiKey = 'YOUR_BREVO_API_KEY';

    try {
        console.log('✅ Brevo API Key configured');
        console.log(`   API Key: ${apiKey.substring(0, 30)}...`);
        console.log(`   From Email: structcrew@gmail.com\n`);

        console.log('Sending test email to: structcrew@gmail.com\n');

        const template = await loadTemplate();
        const htmlContent = template({
            to: 'structcrew@gmail.com',
            subject: 'Test Email - Brevo API Working',
            companyName: 'Test Architecture Firm',
            businessType: 'Architecture & Design',
            email: 'info@structcrew.online',
            phone: ''
        });

        const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: {
                name: 'StructCrew',
                email: 'structcrew@gmail.com'
            },
            to: [{
                email: 'structcrew@gmail.com'
            }],
            subject: 'Test Email - Brevo API Working',
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
            console.log('\n✅ SUCCESS! Brevo API key is working!\n');
            console.log('Message ID:', response.data.messageId || response.data.messageId);
            console.log('From: StructCrew <structcrew@gmail.com>');
            console.log('To: structcrew@gmail.com\n');
            console.log('🎉 Brevo is ready to send mass emails!\n');
            console.log('Benefits:');
            console.log('  ✅ 300 free emails/day');
            console.log('  ✅ 80-85% delivery rate');
            console.log('  ✅ Works with Gmail from address\n');
            console.log('\nSend 118 emails with:');
            console.log('  node send-brevo-mass.js\n');
            return true;
        } else {
            console.log('\n❌ Unexpected response:', JSON.stringify(response.data, null, 2));
            return false;
        }

    } catch (error) {
        console.log('\n❌ Error:', error.response?.data || error.message);
        
        if (error.response?.data?.code === 'invalid_api_key') {
            console.log('\n⚠️  API Key invalid. Please check:\n');
            console.log('1. Go to: https://app.brevo.com/settings/api-keys');
            console.log('2. Verify the key matches\n');
        }
        
        return false;
    }
}

testBrevo().catch(error => {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
});
