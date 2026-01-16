#!/usr/bin/env node

/**
 * Database Setup Helper Script
 * 
 * This script helps you verify your Supabase setup
 * Run: node setup-database.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔍 Tapped Database Setup Checker\n');
console.log('This will help you verify your Supabase configuration.\n');

const questions = [
  {
    key: 'hasSupabase',
    question: 'Have you created a Supabase project? (yes/no): ',
    validator: (answer) => ['yes', 'y', 'no', 'n'].includes(answer.toLowerCase())
  },
  {
    key: 'hasSchema',
    question: 'Have you run the SQL schema in Supabase SQL Editor? (yes/no): ',
    validator: (answer) => ['yes', 'y', 'no', 'n'].includes(answer.toLowerCase())
  },
  {
    key: 'hasEnvFile',
    question: 'Have you created .env.local file with Supabase credentials? (yes/no): ',
    validator: (answer) => ['yes', 'y', 'no', 'n'].includes(answer.toLowerCase())
  }
];

const answers = {};

function askQuestion(index) {
  if (index >= questions.length) {
    generateReport();
    return;
  }

  const q = questions[index];
  rl.question(q.question, (answer) => {
    if (!q.validator(answer)) {
      console.log('Please answer yes or no.\n');
      askQuestion(index);
      return;
    }
    answers[q.key] = answer.toLowerCase().startsWith('y');
    askQuestion(index + 1);
  });
}

function generateReport() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 Setup Status Report\n');
  
  const checks = [
    { name: 'Supabase Project Created', status: answers.hasSupabase },
    { name: 'SQL Schema Run', status: answers.hasSchema },
    { name: 'Environment Variables Set', status: answers.hasEnvFile }
  ];

  checks.forEach(check => {
    const icon = check.status ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
  });

  console.log('\n' + '='.repeat(50));

  if (!answers.hasSupabase) {
    console.log('\n📝 Next Steps:');
    console.log('1. Go to https://supabase.com');
    console.log('2. Create a new project');
    console.log('3. See QUICK_DATABASE_SETUP.md for detailed steps\n');
  } else if (!answers.hasSchema) {
    console.log('\n📝 Next Steps:');
    console.log('1. Open supabase/schema.sql');
    console.log('2. Copy all contents');
    console.log('3. Go to Supabase → SQL Editor');
    console.log('4. Paste and run the SQL\n');
  } else if (!answers.hasEnvFile) {
    console.log('\n📝 Next Steps:');
    console.log('1. Create .env.local in project root');
    console.log('2. Add these lines:');
    console.log('   VITE_SUPABASE_URL=your_url_here');
    console.log('   VITE_SUPABASE_ANON_KEY=your_key_here');
    console.log('3. Restart your dev server\n');
  } else {
    console.log('\n🎉 Great! Your setup looks complete.');
    console.log('\nTo verify:');
    console.log('1. Start your app: npm run dev');
    console.log('2. Sign up for an account');
    console.log('3. Check Supabase → Table Editor → users');
    console.log('4. You should see your user there!\n');
  }

  rl.close();
}

askQuestion(0);
