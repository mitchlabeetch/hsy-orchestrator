#!/usr/bin/env node

/**
 * HSY Orchestrator - CLI Entry Point
 * 
 * Global command-line interface for HSY autonomous orchestrator
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

// Version from package.json
const packageJson = require('../package.json');

// Check if running inside Kiro
function isKiroContext() {
  return process.env.KIRO_CONTEXT === 'true' || 
         typeof global.kiroTools !== 'undefined';
}

// Check if in a git repository
function isGitRepo() {
  try {
    const gitDir = path.join(process.cwd(), '.git');
    return fs.existsSync(gitDir);
  } catch (error) {
    return false;
  }
}

// Main CLI setup
program
  .name('hsy')
  .description('HSY Autonomous Orchestrator - AI-powered project development')
  .version(packageJson.version);

// Init command - Setup HSY in current repository
program
  .command('init')
  .description('Initialize HSY in the current repository')
  .option('-f, --force', 'Force initialization even if .kiro exists')
  .option('--no-kiro-check', 'Skip Kiro context check')
  .action(async (options) => {
    const { initCommand } = require('../dist/commands/init');
    await initCommand(options);
  });

// Start command - Launch the orchestrator
program
  .command('start')
  .description('Start the HSY orchestrator')
  .option('-m, --mode <mode>', 'Launch mode: tui, cli, or auto', 'tui')
  .option('--model <preset>', 'Model preset: ultimate, balanced, credit-saver, custom', 'balanced')
  .action(async (options) => {
    const { startCommand } = require('../dist/commands/start');
    await startCommand(options);
  });

// Demo command - Run interactive demo
program
  .command('demo')
  .description('Run interactive demonstration')
  .action(async () => {
    const { demoCommand } = require('../dist/commands/demo');
    await demoCommand();
  });

// Test command - Run self-tests
program
  .command('test')
  .description('Run system self-tests')
  .action(async () => {
    const { testCommand } = require('../dist/commands/test');
    await testCommand();
  });

// Status command - Show current status
program
  .command('status')
  .description('Show orchestrator status')
  .action(async () => {
    const { statusCommand } = require('../dist/commands/status');
    await statusCommand();
  });

// Config command - Manage configuration
program
  .command('config')
  .description('Manage HSY configuration')
  .option('-s, --set <key=value>', 'Set configuration value')
  .option('-g, --get <key>', 'Get configuration value')
  .option('-l, --list', 'List all configuration')
  .action(async (options) => {
    const { configCommand } = require('../dist/commands/config');
    await configCommand(options);
  });

// Hooks command - Manage hooks
program
  .command('hooks')
  .description('Manage HSY hooks')
  .option('-l, --list', 'List all hooks')
  .option('-a, --add <name>', 'Add a new hook')
  .option('-r, --remove <name>', 'Remove a hook')
  .action(async (options) => {
    const { hooksCommand } = require('../dist/commands/hooks');
    await hooksCommand(options);
  });

// Doctor command - Diagnose issues
program
  .command('doctor')
  .description('Diagnose and fix common issues')
  .action(async () => {
    const { doctorCommand } = require('../dist/commands/doctor');
    await doctorCommand();
  });

// Uninstall command - Remove HSY from repository
program
  .command('uninstall')
  .description('Remove HSY from the current repository')
  .option('-f, --force', 'Force removal without confirmation')
  .action(async (options) => {
    const { uninstallCommand } = require('../dist/commands/uninstall');
    await uninstallCommand(options);
  });

// Error handling
program.exitOverride();

try {
  program.parse(process.argv);
} catch (error) {
  if (error.code === 'commander.help') {
    process.exit(0);
  }
  
  console.error(chalk.red('\n❌ Error:'), error.message);
  
  if (error.code === 'ENOENT') {
    console.error(chalk.yellow('\n💡 Tip: Make sure you\'re in a valid repository'));
    console.error(chalk.yellow('   Run "hsy init" to set up HSY in this repository\n'));
  }
  
  process.exit(1);
}

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
