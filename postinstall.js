#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🎉 Figma to React Generator installed successfully!\n');

console.log('📋 Next steps:');
console.log('1. Run: npm run setup (to configure API keys)');
console.log('2. Run: npm start (to start the development server)');
console.log('3. Open http://localhost:5173 in your browser\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('💡 Tip: Run "npm run setup" to configure your API keys automatically');
  console.log('   Or copy env.example to .env and add your keys manually\n');
}

console.log('📚 Documentation:');
console.log('- README.md - Project overview and setup');
console.log('- CONTRIBUTING.md - How to contribute');
console.log('- CHANGELOG.md - Version history\n');

console.log('🔗 Useful links:');
console.log('- Figma API: https://www.figma.com/developers/api');
console.log('- Google Gemini: https://makersuite.google.com/app/apikey');
console.log('- Material-UI: https://mui.com/\n');

console.log('🚀 Happy coding!\n');



