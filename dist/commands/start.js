#!/usr/bin/env node

/**
 * HSY Start Command
 * 
 * Starts the HSY orchestrator
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { spawn } = require('child_process');

function isKiroContext() {
  return process.env.KIRO_CONTEXT === 'true' || 
         typeof global.kiroTools !== 'undefined';
}

async function startCommand(options) {
  const cwd = process.cwd();
  const kiroDir = path.join(cwd, '.kiro');
  
  // Check if HSY is initialized
  if (!fs.existsSync(kiroDir)) {
    console.log(chalk.red('\n❌ HSY not initialized in this repository'));
    console.log(chalk.yellow('   Run: hsy init\n'));
    process.exit(1);
  }
  
  // Check Kiro context for non-demo modes
  if (options.mode !== 'demo' && !isKiroContext()) {
    console.log(chalk.yellow('\n⚠️  Warning: Not running inside Kiro context'));
    console.log(chalk.yellow('   HSY works best when invoked from within Kiro\n'));
    console.log(chalk.cyan('💡 To use HSY with Kiro:'));
    console.log(chalk.gray('   1. Open this repository in Kiro'));
    console.log(chalk.gray('   2. Run: hsy start from within Kiro'));
    console.log(chalk.gray('   3. Or invoke via invokeSubAgent\n'));
    
    const inquirer = require('inquirer');
    const { continueAnyway } = await inquirer.prompt([{
      type: 'confirm',
      name: 'continueAnyway',
      message: 'Continue in standalone mode?',
      default: false
    }]);
    
    if (!continueAnyway) {
      process.exit(0);
    }
  }
  
  console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║                                                            ║'));
  console.log(chalk.cyan.bold('║     HSY Orchestrator - Starting                            ║'));
  console.log(chalk.cyan.bold('║                                                            ║'));
  console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n'));
  
  console.log(chalk.cyan(`Mode: ${options.mode}`));
  console.log(chalk.cyan(`Model Preset: ${options.model}\n`));
  
  let launchScript;
  
  switch (options.mode) {
    case 'tui':
      launchScript = path.join(kiroDir, 'hsy-launch');
      break;
    case 'cli':
      launchScript = path.join(kiroDir, 'hsy-auto');
      break;
    case 'auto':
      launchScript = path.join(kiroDir, 'hsy-auto');
      break;
    default:
      console.log(chalk.red(`❌ Unknown mode: ${options.mode}`));
      console.log(chalk.yellow('   Valid modes: tui, cli, auto\n'));
      process.exit(1);
  }
  
  if (!fs.existsSync(launchScript)) {
    console.log(chalk.red(`❌ Launch script not found: ${launchScript}`));
    console.log(chalk.yellow('   Try running: hsy init --force\n'));
    process.exit(1);
  }
  
  // Launch the orchestrator
  console.log(chalk.cyan('🚀 Launching orchestrator...\n'));
  
  const child = spawn('node', [launchScript], {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      HSY_MODEL_PRESET: options.model
    }
  });
  
  child.on('error', (error) => {
    console.log(chalk.red(`\n❌ Failed to start orchestrator: ${error.message}\n`));
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(chalk.red(`\n❌ Orchestrator exited with code ${code}\n`));
      process.exit(code);
    }
  });
}

module.exports = { startCommand };
