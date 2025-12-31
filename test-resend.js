const MultiSender = require('./src/server/multi-sender');

(async () => {
    const sender = new MultiSender();
    await sender.loadConfig();

    const rs = await sender.sendEmail('iamyash95@gmail.com', 'Resend Fixed', {
        provider: 'resend',
        html: '<p>Resend working now!</p>'
    });
    console.log('Result:', JSON.stringify(rs));
})();
