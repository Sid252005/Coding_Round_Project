/**
 * seedAdmin.js
 * Run ONCE to generate the bcrypt hash for your admin password.
 * 
 * Usage: node scripts/seedAdmin.js
 * Then copy the output hash into your .env as ADMIN_PASSWORD_HASH
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@dh.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

async function generateHash() {
  console.log(`\n🪄 Deathly Hallows — Admin Setup`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Email:    ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log(`\nGenerating bcrypt hash...`);

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  console.log(`\n✅ Hash generated! Copy these into your .env file:\n`);
  console.log(`ADMIN_EMAIL=${ADMIN_EMAIL}`);
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`\n⚠️  Keep this hash secret — it's like a Horcrux!\n`);
}

generateHash().catch(console.error);
