#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function executeCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} - DONE!\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} - FAILED!\n`);
    return false;
  }
}

async function main() {
  console.log('\n🚀 AUTOMATED DEPLOYMENT SETUP\n');
  console.log('This script will:');
  console.log('1. Initialize Git');
  console.log('2. Commit all your files');
  console.log('3. Connect to your GitHub repository');
  console.log('4. Push everything to GitHub\n');

  // Check if .env.local has been configured
  const envPath = '.env.local';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('REPLACE_WITH_YOUR')) {
      console.log('⚠️  WARNING: Your .env.local file still has placeholder values!');
      console.log('Please update it with your Supabase credentials first (see DEPLOY_NOW.md Step 2)\n');
      
      rl.question('Do you want to continue anyway? (y/n): ', (answer) => {
        if (answer.toLowerCase() !== 'y') {
          console.log('\n❌ Deployment cancelled. Update .env.local first!\n');
          rl.close();
          process.exit(0);
        } else {
          proceedWithSetup();
        }
      });
      return;
    }
  }

  proceedWithSetup();
}

function proceedWithSetup() {
  rl.question('\n📋 Enter your GitHub repository URL (e.g., https://github.com/yourname/parcel-monitor.git): ', (repoUrl) => {
    if (!repoUrl || !repoUrl.includes('github.com')) {
      console.log('\n❌ Invalid GitHub URL! Please try again.\n');
      rl.close();
      process.exit(1);
    }

    console.log('\n🎯 Starting deployment setup...\n');

    // Check if git is already initialized
    if (!fs.existsSync('.git')) {
      executeCommand('git init', 'Initializing Git repository');
    } else {
      console.log('✅ Git already initialized - SKIPPED\n');
    }

    // Create .gitignore if it doesn't exist
    const gitignoreContent = `node_modules/
.next/
.env.local
.DS_Store
*.log
.vercel
`;
    
    if (!fs.existsSync('.gitignore')) {
      fs.writeFileSync('.gitignore', gitignoreContent);
      console.log('✅ Created .gitignore file\n');
    }

    // Add all files
    executeCommand('git add .', 'Adding all files to Git');

    // Commit
    executeCommand('git commit -m "Initial deployment commit"', 'Creating initial commit');

    // Set main branch
    executeCommand('git branch -M main', 'Setting main branch');

    // Add remote (remove if exists)
    console.log('\n🔄 Connecting to GitHub...');
    try {
      execSync('git remote remove origin', { stdio: 'ignore' });
    } catch (e) {
      // Remote doesn't exist, that's ok
    }
    
    executeCommand(`git remote add origin ${repoUrl}`, 'Adding GitHub remote');

    // Push to GitHub
    const pushSuccess = executeCommand('git push -u origin main', 'Pushing to GitHub');

    if (pushSuccess) {
      console.log('\n🎉 SUCCESS! Your code is now on GitHub!\n');
      console.log('📝 NEXT STEPS:');
      console.log('1. Go to https://vercel.com');
      console.log('2. Sign in with GitHub');
      console.log('3. Import your parcel-monitor repository');
      console.log('4. Add your Supabase environment variables');
      console.log('5. Click Deploy!\n');
      console.log('👉 See DEPLOY_NOW.md Step 4 for detailed instructions.\n');
    } else {
      console.log('\n⚠️  Push to GitHub failed!');
      console.log('This might be because:');
      console.log('1. You need to authenticate with GitHub (use gh auth login)');
      console.log('2. The repository URL is incorrect');
      console.log('3. The repository already has content\n');
      console.log('📸 Send me a screenshot of the error and I\'ll help you fix it!\n');
    }

    rl.close();
  });
}

main();
