import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, 'packages/db/.env') });

console.log('--- Environment Variable Debugger ---');
const dbUrl = process.env.DATABASE_URL;

if (dbUrl) {
  console.log('✅ DATABASE_URL found!');
  // Mask password for security
  const maskedUrl = dbUrl.replace(/:([^:]+)@/, ':********@');
  console.log('   Value (masked):', maskedUrl);
} else {
  console.log('❌ DATABASE_URL is not defined.');
  console.log('   Please check the .env file in your project root.');
  console.log('   It should contain exactly: DATABASE_URL="your_connection_string"');
}
console.log('---------------------------------');
