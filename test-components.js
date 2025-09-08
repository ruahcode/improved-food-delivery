const fs = require('fs');
const path = require('path');

console.log('🔍 Testing component files...\n');

const components = [
  'client/src/components/ProtectedRoute.jsx',
  'client/src/pages/Orders.jsx', 
  'client/src/pages/RestaurantDashboard.jsx'
];

components.forEach(componentPath => {
  const fullPath = path.join(__dirname, componentPath);
  
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Basic syntax checks
    const hasImports = content.includes('import');
    const hasExport = content.includes('export default');
    const hasReact = content.includes('React') || content.includes('useState') || content.includes('useEffect');
    
    console.log(`✅ ${componentPath}`);
    console.log(`   - Has imports: ${hasImports ? '✅' : '❌'}`);
    console.log(`   - Has export: ${hasExport ? '✅' : '❌'}`);
    console.log(`   - Uses React: ${hasReact ? '✅' : '❌'}`);
    
    // Check for common issues
    if (content.includes('useAuth') && !content.includes('AuthContext')) {
      console.log('   ⚠️  Uses useAuth hook - may cause issues');
    }
    
    console.log('');
  } else {
    console.log(`❌ ${componentPath} - File not found`);
  }
});

console.log('🎉 Component check complete!');