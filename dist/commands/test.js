#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { spawn } = require('child_process');

async function testCommand() {
  const cwd = process.cwd();
  const kiroDir = path.join(cwd, '.kiro');
  
  if (!fs.existsSync(kiroDir)) {
    console.log(chalk.red('\n❌ HSY not initialized'));
    console.log(chalk.yellow('   Run: hsy init\n'));
    process.exit(1);
  }
  
  const launchScript = path.join(kiroDir, 'hsy-launch');
  
  if (!fs.existsSync(launchScript)) {
    console.log(chalk.red('❌ Launch script not found\n'));
    process.exit(1);
  }
  
  const child = spawn('node', [launchScript, 'test'], {
    cwd,
    stdio: 'inherit'
  });
  
  child.on('error', (error) => {
    console.log(chalk.red(`\n❌ Tests failed: ${error.message}\n`));
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

module.exports = { testCommand };
