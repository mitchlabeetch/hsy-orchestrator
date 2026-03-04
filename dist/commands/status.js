#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

async function statusCommand() {
  const cwd = process.cwd();
  const kiroDir = path.join(cwd, '.kiro');
  
  console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║     HSY Orchestrator - Status                              ║'));
  console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n'));
  
  // Check installation
  if (!fs.existsSync(kiroDir)) {
    console.log(chalk.red('❌ HSY not installed in this repository\n'));
    console.log(chalk.yellow('💡 Run: hsy init\n'));
    return;
  }
  
  console.log(chalk.green('✅ HSY installed\n'));
  
  // Check configuration
  const configFile = path.join(kiroDir, 'hsy-orchestrator/config.json');
  if (fs.existsSync(configFile)) {
    const config = await fs.readJson(configFile);
    console.log(chalk.cyan('📋 Configuration:'));
    console.log(chalk.gray(`   Version: ${config.version}`));
    console.log(chalk.gray(`   Project: ${config.project?.name || 'Unknown'}`));
    console.log(chalk.gray(`   Scenario: ${config.project?.scenario || 'Unknown'}`));
    console.log(chalk.gray(`   Model Preset: ${config.orchestrator?.modelPreset || 'balanced'}\n`));
  }
  
  // Check state
  const stateFile = path.join(kiroDir, 'hsy-orchestrator/state/orchestrator-state.json');
  if (fs.existsSync(stateFile)) {
    const state = await fs.readJson(stateFile);
    console.log(chalk.cyan('📊 Execution Status:'));
    console.log(chalk.gray(`   Total Executions: ${state.metrics?.totalExecutions || 0}`));
    console.log(chalk.gray(`   Successful: ${state.metrics?.successfulExecutions || 0}`));
    console.log(chalk.gray(`   Failed: ${state.metrics?.failedExecutions || 0}`));
    console.log(chalk.gray(`   Completed Hooks: ${state.completedHooks?.length || 0}`));
    if (state.pendingHook) {
      console.log(chalk.yellow(`   Pending: ${state.pendingHook}`));
    }
    console.log();
  }
  
  // Check hooks
  const hooksDir = path.join(kiroDir, 'hooks');
  if (fs.existsSync(hooksDir)) {
    const hooks = fs.readdirSync(hooksDir).filter(f => f.endsWith('.kiro.hook'));
    console.log(chalk.cyan(`📌 Hooks: ${hooks.length} installed\n`));
  }
  
  // Check logs
  const logsDir = path.join(kiroDir, 'hsy-orchestrator/logs');
  if (fs.existsSync(logsDir)) {
    const logFile = path.join(logsDir, 'orchestrator.log');
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(chalk.cyan(`📝 Logs: ${sizeMB} MB`));
      console.log(chalk.gray(`   Location: .kiro/hsy-orchestrator/logs/orchestrator.log\n`));
    }
  }
  
  console.log(chalk.cyan('🚀 Quick Commands:'));
  console.log(chalk.gray('   hsy start       - Start orchestrator'));
  console.log(chalk.gray('   hsy demo        - Run demo'));
  console.log(chalk.gray('   hsy test        - Run self-tests'));
  console.log(chalk.gray('   hsy hooks       - Manage hooks\n'));
}

module.exports = { statusCommand };
