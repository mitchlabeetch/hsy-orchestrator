#!/usr/bin/env node

/**
 * HSY Init Command
 * 
 * Initializes HSY in the current repository
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

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

async function initCommand(options) {
  console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║                                                            ║'));
  console.log(chalk.cyan.bold('║     HSY Orchestrator - Initialization                      ║'));
  console.log(chalk.cyan.bold('║                                                            ║'));
  console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n'));
  
  const cwd = process.cwd();
  const kiroDir = path.join(cwd, '.kiro');
  
  // Check if Kiro context (unless skipped)
  if (!options.kiroCheck && !isKiroContext()) {
    console.log(chalk.yellow('⚠️  Warning: Not running inside Kiro context'));
    console.log(chalk.yellow('   HSY works best when invoked from within Kiro\n'));
    
    const { continueAnyway } = await inquirer.prompt([{
      type: 'confirm',
      name: 'continueAnyway',
      message: 'Continue initialization anyway?',
      default: false
    }]);
    
    if (!continueAnyway) {
      console.log(chalk.yellow('\n💡 To use HSY with Kiro:'));
      console.log(chalk.yellow('   1. Open this repository in Kiro'));
      console.log(chalk.yellow('   2. Run: hsy init from within Kiro\n'));
      process.exit(0);
    }
  }
  
  // Check if git repository
  if (!isGitRepo()) {
    console.log(chalk.yellow('⚠️  Warning: Not a git repository'));
    console.log(chalk.yellow('   HSY works best in version-controlled projects\n'));
    
    const { initGit } = await inquirer.prompt([{
      type: 'confirm',
      name: 'initGit',
      message: 'Initialize git repository?',
      default: true
    }]);
    
    if (initGit) {
      const { execSync } = require('child_process');
      try {
        execSync('git init', { cwd, stdio: 'inherit' });
        console.log(chalk.green('✅ Git repository initialized\n'));
      } catch (error) {
        console.log(chalk.red('❌ Failed to initialize git repository'));
        console.log(chalk.yellow('   Please run: git init\n'));
      }
    }
  }
  
  // Check if .kiro already exists
  if (fs.existsSync(kiroDir) && !options.force) {
    console.log(chalk.yellow('⚠️  .kiro directory already exists'));
    
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: 'Overwrite existing installation?',
      default: false
    }]);
    
    if (!overwrite) {
      console.log(chalk.yellow('\n💡 Use --force to overwrite existing installation'));
      console.log(chalk.yellow('   Or run: hsy status to check current installation\n'));
      process.exit(0);
    }
    
    // Backup existing installation
    const backupDir = path.join(cwd, `.kiro.backup.${Date.now()}`);
    console.log(chalk.cyan(`\n📦 Backing up existing installation to ${path.basename(backupDir)}...`));
    await fs.copy(kiroDir, backupDir);
    console.log(chalk.green('✅ Backup created\n'));
  }
  
  // Gather project information
  console.log(chalk.cyan('📋 Project Information\n'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: path.basename(cwd)
    },
    {
      type: 'input',
      name: 'projectDescription',
      message: 'Project description:',
      default: 'A project using HSY autonomous orchestrator'
    },
    {
      type: 'list',
      name: 'scenario',
      message: 'What best describes your project?',
      choices: [
        { name: 'New project (just starting)', value: 'new' },
        { name: 'Existing project with code (needs documentation)', value: 'catchup' },
        { name: 'Has documentation (needs implementation plan)', value: 'planning' },
        { name: 'Ready for implementation (has docs and plans)', value: 'execution' }
      ]
    },
    {
      type: 'list',
      name: 'modelPreset',
      message: 'Choose model preset:',
      choices: [
        { name: 'Balanced (recommended) - Good quality, moderate cost', value: 'balanced' },
        { name: 'Ultimate - Best quality, highest cost', value: 'ultimate' },
        { name: 'Credit-Saver - Efficient, lower cost', value: 'credit-saver' },
        { name: 'Custom - Configure manually later', value: 'custom' }
      ],
      default: 'balanced'
    }
  ]);
  
  // Create directory structure
  console.log(chalk.cyan('\n📁 Creating directory structure...'));
  
  const templateDir = path.join(__dirname, '../../templates');
  
  // Copy core files
  await fs.ensureDir(kiroDir);
  await fs.ensureDir(path.join(kiroDir, 'hsy-orchestrator'));
  await fs.ensureDir(path.join(kiroDir, 'hsy-orchestrator/src'));
  await fs.ensureDir(path.join(kiroDir, 'hsy-orchestrator/state'));
  await fs.ensureDir(path.join(kiroDir, 'hsy-orchestrator/logs'));
  await fs.ensureDir(path.join(kiroDir, 'hooks'));
  
  // Copy source files
  console.log(chalk.cyan('   Copying orchestrator source files...'));
  await fs.copy(
    path.join(templateDir, 'orchestrator/src'),
    path.join(kiroDir, 'hsy-orchestrator/src')
  );
  
  // Copy configuration
  console.log(chalk.cyan('   Creating configuration...'));
  const config = {
    version: '3.0.0',
    project: {
      name: answers.projectName,
      description: answers.projectDescription,
      scenario: answers.scenario
    },
    orchestrator: {
      modelPreset: answers.modelPreset,
      autoStart: false,
      checkInterval: 5000
    },
    paths: {
      workspace: cwd,
      kiro: kiroDir,
      hooks: path.join(kiroDir, 'hooks'),
      state: path.join(kiroDir, 'hsy-orchestrator/state'),
      logs: path.join(kiroDir, 'hsy-orchestrator/logs')
    }
  };
  
  await fs.writeJson(
    path.join(kiroDir, 'hsy-orchestrator/config.json'),
    config,
    { spaces: 2 }
  );
  
  // Copy package.json
  await fs.copy(
    path.join(templateDir, 'orchestrator/package.json'),
    path.join(kiroDir, 'hsy-orchestrator/package.json')
  );
  
  // Copy wrapper and launchers
  console.log(chalk.cyan('   Installing launchers...'));
  await fs.copy(
    path.join(templateDir, 'bin/hsy-launch'),
    path.join(kiroDir, 'hsy-launch')
  );
  await fs.copy(
    path.join(templateDir, 'bin/hsy-auto'),
    path.join(kiroDir, 'hsy-auto')
  );
  await fs.copy(
    path.join(templateDir, 'bin/hsy-demo'),
    path.join(kiroDir, 'hsy-demo')
  );
  await fs.copy(
    path.join(templateDir, 'orchestrator/kiro-wrapper.js'),
    path.join(kiroDir, 'hsy-orchestrator/kiro-wrapper.js')
  );
  
  // Make scripts executable
  await fs.chmod(path.join(kiroDir, 'hsy-launch'), 0o755);
  await fs.chmod(path.join(kiroDir, 'hsy-auto'), 0o755);
  await fs.chmod(path.join(kiroDir, 'hsy-demo'), 0o755);
  
  // Copy hooks based on scenario
  console.log(chalk.cyan('   Installing hooks...'));
  const hooksToInstall = getHooksForScenario(answers.scenario);
  for (const hook of hooksToInstall) {
    await fs.copy(
      path.join(templateDir, 'hooks', hook),
      path.join(kiroDir, 'hooks', hook)
    );
  }
  
  // Copy documentation
  console.log(chalk.cyan('   Installing documentation...'));
  await fs.copy(
    path.join(templateDir, 'docs/README.md'),
    path.join(kiroDir, 'README.md')
  );
  await fs.copy(
    path.join(templateDir, 'docs/QUICK_START.md'),
    path.join(kiroDir, 'QUICK_START.md')
  );
  await fs.copy(
    path.join(templateDir, 'docs/HSY_KIRO_INTEGRATION_GUIDE.md'),
    path.join(kiroDir, 'HSY_KIRO_INTEGRATION_GUIDE.md')
  );
  await fs.copy(
    path.join(templateDir, 'docs/HSY_QUICK_REFERENCE.md'),
    path.join(kiroDir, 'HSY_QUICK_REFERENCE.md')
  );
  
  // Create docs structure if needed
  if (answers.scenario === 'new' || answers.scenario === 'catchup') {
    console.log(chalk.cyan('   Creating documentation structure...'));
    await fs.ensureDir(path.join(cwd, 'docs'));
    await fs.ensureDir(path.join(cwd, 'docs/goals_and_principles'));
    await fs.ensureDir(path.join(cwd, 'docs/planning'));
    await fs.ensureDir(path.join(cwd, 'docs/technical'));
  }
  
  // Install dependencies
  console.log(chalk.cyan('\n📦 Installing dependencies...'));
  const { execSync } = require('child_process');
  try {
    execSync('npm install', {
      cwd: path.join(kiroDir, 'hsy-orchestrator'),
      stdio: 'inherit'
    });
    console.log(chalk.green('✅ Dependencies installed\n'));
  } catch (error) {
    console.log(chalk.yellow('⚠️  Failed to install dependencies automatically'));
    console.log(chalk.yellow('   Please run: cd .kiro/hsy-orchestrator && npm install\n'));
  }
  
  // Initialize state
  console.log(chalk.cyan('🔧 Initializing state...'));
  const initialState = {
    version: '3.0.0',
    initialized: new Date().toISOString(),
    scenario: answers.scenario,
    completedHooks: [],
    pendingHook: null,
    context: {
      projectPhase: answers.scenario,
      lastExecution: null
    },
    metrics: {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0
    }
  };
  
  await fs.writeJson(
    path.join(kiroDir, 'hsy-orchestrator/state/orchestrator-state.json'),
    initialState,
    { spaces: 2 }
  );
  
  console.log(chalk.green('✅ State initialized\n'));
  
  // Success message
  console.log(chalk.green.bold('\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.green.bold('║                                                            ║'));
  console.log(chalk.green.bold('║     ✅ HSY Successfully Initialized!                       ║'));
  console.log(chalk.green.bold('║                                                            ║'));
  console.log(chalk.green.bold('╚════════════════════════════════════════════════════════════╝\n'));
  
  console.log(chalk.cyan('📚 Next Steps:\n'));
  console.log(chalk.white('   1. Read the quick start guide:'));
  console.log(chalk.gray('      cat .kiro/QUICK_START.md\n'));
  
  console.log(chalk.white('   2. Run the demo:'));
  console.log(chalk.gray('      hsy demo\n'));
  
  console.log(chalk.white('   3. Start the orchestrator:'));
  console.log(chalk.gray('      hsy start\n'));
  
  if (isKiroContext()) {
    console.log(chalk.white('   4. Or invoke from Kiro:'));
    console.log(chalk.gray('      invokeSubAgent({'));
    console.log(chalk.gray('        name: "general-task-execution",'));
    console.log(chalk.gray('        prompt: "Run: node .kiro/hsy-orchestrator/kiro-wrapper.js"'));
    console.log(chalk.gray('      })\n'));
  }
  
  console.log(chalk.cyan('📖 Documentation:'));
  console.log(chalk.gray('   .kiro/README.md'));
  console.log(chalk.gray('   .kiro/QUICK_START.md'));
  console.log(chalk.gray('   .kiro/HSY_KIRO_INTEGRATION_GUIDE.md'));
  console.log(chalk.gray('   .kiro/HSY_QUICK_REFERENCE.md\n'));
  
  console.log(chalk.green('🎉 Happy autonomous development!\n'));
}

function getHooksForScenario(scenario) {
  const baseHooks = [
    'hsy-startup.kiro.hook',
    'hsy-catchup.kiro.hook',
    'hsy-plan-setup.kiro.hook',
    'hsy-start-next-plan.kiro.hook',
    'hsy-next-work-run.kiro.hook',
    'hsy-audit-last-run.kiro.hook'
  ];
  
  // All scenarios get all hooks
  return baseHooks;
}

module.exports = { initCommand };
