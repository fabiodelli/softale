const jwt = require('jsonwebtoken');
const fs = require('fs');

// --------------------------------------------------------
// CONFIGURATION
// --------------------------------------------------------
// 1. Download your .p8 file from Apple Developer (Keys section)
// 2. Set the path to the .p8 file here:
const PRIVATE_KEY_PATH = './AuthKey_XXXXXXXXXX.p8';

// 3. Fill in your details from Apple Developer:
const TEAM_ID = 'YOUR_TEAM_ID';       // Found in Membership details (e.g. 3Q7...)
const KEY_ID = 'YOUR_KEY_ID';         // The ID of the Key you created (e.g. 4D8...)
const CLIENT_ID = 'com.your.service'; // The Service ID (NOT Bundle ID) e.g. com.softale.web

// --------------------------------------------------------
// GENERATION
// --------------------------------------------------------

function generateSecret() {
    try {
        if (!fs.existsSync(PRIVATE_KEY_PATH)) {
            console.error(`❌ Error: Could not find .p8 file at: ${PRIVATE_KEY_PATH}`);
            console.log("Please download the key from Apple Developer and update the path in this script.");
            return;
        }

        const privateKey = fs.readFileSync(PRIVATE_KEY_PATH);

        const token = jwt.sign({}, privateKey, {
            algorithm: 'ES256',
            expiresIn: '180d', // 6 months (max allowed by Apple)
            audience: 'https://appleid.apple.com',
            issuer: TEAM_ID,
            subject: CLIENT_ID,
            keyid: KEY_ID,
        });

        console.log('\n✅ Your Apple Client Secret (valid for 6 months):\n');
        console.log(token);
        console.log('\nCopy the string above and paste it into "Secret Key" in Supabase.');

    } catch (err) {
        console.error("Error generating token:", err.message);
    }
}

generateSecret();
