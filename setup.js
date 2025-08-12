#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Figma to React Generator Setup\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  try {
    console.log('This setup will help you configure your API keys.\n');
    
    const figmaToken = await question('Enter your Figma Access Token (or press Enter to skip): ');
    const geminiKey = await question('Enter your Google Gemini API Key (or press Enter to skip): ');
    
    let envContent = '';
    
    if (figmaToken.trim()) {
      envContent += `VITE_FIGMA_ACCESS_TOKEN=${figmaToken.trim()}\n`;
    }
    
    if (geminiKey.trim()) {
      envContent += `VITE_GEMINI_API_KEY=${geminiKey.trim()}\n`;
    }
    
    if (envContent) {
      envContent += '\n# Application Configuration\n';
      envContent += 'VITE_APP_NAME=Figma to React Generator\n';
      envContent += 'VITE_APP_VERSION=1.0.0\n';
      envContent += 'VITE_DEV_MODE=true\n';
      envContent += 'VITE_API_BASE_URL=https://api.figma.com/v1\n';
      
      fs.writeFileSync('.env', envContent);
      console.log('\n✅ .env file created successfully!');
    } else {
      console.log('\n⚠️  No API keys provided. You can add them later to the .env file.');
      console.log('   See env.example for reference.');
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm start');
    console.log('3. Open http://localhost:5173 in your browser');
    
    if (!figmaToken.trim()) {
      console.log('\n🔑 To get your Figma Access Token:');
      console.log('   Visit: https://www.figma.com/developers/api#access-tokens');
    }
    
    if (!geminiKey.trim()) {
      console.log('\n🔑 To get your Google Gemini API Key:');
      console.log('   Visit: https://makersuite.google.com/app/apikey');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

setup();



