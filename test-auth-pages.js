const fs = require('fs');
const path = require('path');

console.log('🔍 Testing auth pages...\n');

const authPages = [
  'client/src/pages/auth/Login.jsx',
  'client/src/pages/auth/Register.jsx',
  'client/src/pages/auth/user.css'
];

authPages.forEach(pagePath => {
  const fullPath = path.join(__dirname, pagePath);
  
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    console.log(`✅ ${pagePath}`);
    
    if (pagePath.includes('.jsx')) {
      const hasAuthContext = content.includes('AuthContext');
      const hasUseAuth = content.includes('useAuth');
      const hasCSS = content.includes('./user.css');
      
      console.log(`   - Uses AuthContext: ${hasAuthContext ? '✅' : '❌'}`);
      console.log(`   - Uses useAuth hook: ${hasUseAuth ? '⚠️' : '✅'}`);
      console.log(`   - Has CSS import: ${hasCSS ? '✅' : '❌'}`);
    } else if (pagePath.includes('.css')) {
      const hasStyles = content.includes('.auth-container') && content.includes('.form-control');
      console.log(`   - Has form styles: ${hasStyles ? '✅' : '❌'}`);
    }
    
    console.log('');
  } else {
    console.log(`❌ ${pagePath} - File not found`);
  }
});

console.log('🎉 Auth pages check complete!');