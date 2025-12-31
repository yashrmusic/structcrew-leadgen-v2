const fs = require('fs-extra');
const validator = require('email-validator');

async function cleanEmails() {
    console.log('🧹 CLEANING EMAIL LIST...\n');

    let validEmails = [];
    let invalidEmails = [];

    const content = await fs.readFile('final_email_list.txt', 'utf8');
    const allEmails = content.split('\n').filter(e => e.trim());

    allEmails.forEach(email => {
        const cleanEmail = email.trim().toLowerCase();

        if (validator.validate(cleanEmail)) {
            validEmails.push(cleanEmail);
        } else {
            invalidEmails.push(email);
        }
    });

    const uniqueValidEmails = [...new Set(validEmails)];

    await fs.writeFile('final_email_list.txt', uniqueValidEmails.join('\n'));
    await fs.writeFile('invalid_emails.txt', invalidEmails.join('\n'));

    console.log(`✅ Valid emails: ${uniqueValidEmails.length}`);
    console.log(`❌ Invalid emails: ${invalidEmails.length}`);
    console.log(`\nSample invalid emails:`);
    invalidEmails.slice(0, 5).forEach(e => console.log(`  - ${e}`));

    if (invalidEmails.length > 5) {
        console.log(`  ... and ${invalidEmails.length - 5} more`);
    }

    console.log(`\n✅ Cleaned email list saved to: final_email_list.txt`);
    console.log(`❌ Invalid emails saved to: invalid_emails.txt\n`);

    return uniqueValidEmails;
}

cleanEmails().then(emails => {
    console.log(`\n📊 READY TO SEND ${emails.length} VALID EMAILS\n`);
});
