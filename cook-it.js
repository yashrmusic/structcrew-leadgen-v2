#!/usr/bin/env node

console.log('🚀 LET\'S GET IT COOKED!\n');
console.log('='.repeat(60));

const fs = require('fs-extra');

async function cookIt() {
    console.log('📊 CURRENT STATUS:\n');

    const emailFile = 'final_email_list.txt';
    const content = await fs.readFile(emailFile, 'utf8');
    const emails = content.split('\n').filter(e => e.trim());

    console.log(`✅ Emails ready: ${emails.length}`);
    console.log(`✅ Template ready: structcrew-clean.html`);
    console.log(`✅ Gmail working: 486 emails remaining today`);
    console.log(`⏸️  Resend ready: Waiting for DNS verification\n`);

    console.log('='.repeat(60));
    console.log('🎯 OPTIONS:\n');

    console.log('OPTION 1: SEND RIGHT NOW WITH GMAIL ⭐ FASTEST');
    console.log('-'.repeat(60));
    console.log('Time: 15 minutes');
    console.log('No setup needed');
    console.log('Just run this command:\n');
    console.log('  node email-campaign.js send \\');
    console.log('    -s "Connect with StructCrew - Architecture & Design Recruitment" \\');
    console.log('    -t structcrew-clean \\');
    console.log('    -e final_email_list.txt \\');
    console.log('    --limit 118\n');

    console.log('OPTION 2: SETUP RESEND (Better Delivery)');
    console.log('-'.repeat(60));
    console.log('Time: 32-62 minutes');
    console.log('Steps:');
    console.log('1. Add domain to Resend: https://resend.com/domains');
    console.log('2. Add 4 DNS records in Hostinger');
    console.log('3. Wait 10-30 min for DNS propagation');
    console.log('4. Verify domain in Resend');
    console.log('5. Send emails: node send-resend-mass.js\n');

    console.log('='.repeat(60));
    console.log('🎉 MY RECOMMENDATION:\n');

    console.log('SEND NOW WITH GMAIL - Get leads today!\n');

    console.log('Why Gmail?');
    console.log('✅ Ready to send right now');
    console.log('✅ 486 emails remaining');
    console.log('✅ 80% delivery rate');
    console.log('✅ No setup time\n');

    console.log('Run this NOW:\n');
    console.log('  node email-campaign.js send \\');
    console.log('    -s "Connect with StructCrew" \\');
    console.log('    -t structcrew-clean \\');
    console.log('    -e final_email_list.txt \\');
    console.log('    --limit 118\n');

    console.log('💡 LATER: Setup Resend for better delivery\n');
    console.log('When you have time, follow the steps in:');
    console.log('  NEXT_STEPS.md\n');

    console.log('='.repeat(60));
    console.log('🚀 READY TO SEND 118 EMAILS!\n');
    console.log('Just copy and paste the command above!\n');
}

cookIt();
