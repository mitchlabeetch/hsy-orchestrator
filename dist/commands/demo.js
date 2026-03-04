#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { spawn } = require('child_process');

async function demoCommand() {
  const cwd = process.cwd();
  const kiroDir = path.join(cwd, '.kiro');
  
  if (!fs.existsSync(kiroDir)) {
    console.log(chalk.red('\n❌ HSY not initialized'));
    console.log(chalk.yellow('   Run: hsy init\n'));
    process.exit(1);
  }
  
  const demoScript = path.join(kiroDir, 'hsy-demo');
  
  if (!fs.existsSync(demoScript)) {
    console.log(chalk.red('❌ Demo script not found\n'));
    process.exit(1);
  }
  
  const child = spawn('node', [demoScript], {
    cwd,
    stdio: 'inherit'
  });
  
  child.on('error', (error) => {
    console.log(chalk.red(`\n❌ Demo failed: ${error.message}\n`));
    process.exit(1);
  });
}

module.exports = { demoCommand };
