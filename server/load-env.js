// Script to verify environment variables are loaded correctly
require('dotenv').config();

console.log('Environment Variables Check:');
console.log('--------------------------');
console.log(`PORT: ${process.env.PORT ? 'Set' : 'Not Set'}`);
console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'Not Set'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not Set'}`);
console.log(`CHAPA_PUBLIC_KEY: ${process.env.CHAPA_PUBLIC_KEY ? 'Set' : 'Not Set'}`);
console.log(`CHAPA_SECRET_KEY: ${process.env.CHAPA_SECRET_KEY ? 'Set' : 'Not Set'}`);

if (!process.env.CHAPA_SECRET_KEY) {
  console.error('\nWARNING: CHAPA_SECRET_KEY is not set. Payment functionality will not work properly.');
  console.error('Make sure your .env file contains the CHAPA_SECRET_KEY variable and is being loaded correctly.');
}