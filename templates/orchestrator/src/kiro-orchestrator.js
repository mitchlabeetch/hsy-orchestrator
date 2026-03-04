#!/usr/bin/env node

/**
 * HSY Autonomous Orchestrator - Kiro Native Version (PRODUCTION)
 * 
 * This orchestrator integrates with Kiro's native hook system.
 * It decides which hook to run next and triggers it through Kiro.
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// ============================================================================
// CONFIGURATION
// ============================================================================

class Config {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot || process.cwd();
    this.configPath = path.join(this.workspaceRoot, '.kiro/hsy-orchestrator/config.json');
    this.config = this.loadConfig();
    
    // Resolve paths relative to workspace root
    this.hooksDir = path.join(this.workspaceRoot, this.config.paths.hooks);
    this.docsDir = path.join(this.workspaceRoot, this.config.paths.docs);
    this.stateDir = path.join(this.workspaceRoot, this.config.paths.state);
    this.logsDir = path.join(this.workspaceRoot, this.config.paths.logs);
    
    this.ensureDirectories();
  }
  
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (error) {
      console.error(`Failed to load config: ${error.message}`);
    }
    
    return {
      orchestrator: {
        mode: 'autonomous',
        pollInterval: 5000,
        maxRetries: 3,
        timeout: 300000
      },
      paths: {
        hooks: '.kiro/hooks',
        docs: 'docs',
        state: '.kiro/hsy-orchestrator/state',
        logs: '.kiro/hsy-orchestrator/logs'
      },
      humanInteraction: {
        confidenceThreshold: 0.7,
        notificationEnabled: true,
        notificationChannel: 'kiro-agent'
      },
      execution: {
        useKiroAgent: true,
        parallelExecution: false,
        autoBackup: true,
        safetyChecks: true
      }
    };
  }
  
  ensureDirectories() {
    [this.stateDir, this.logsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
}

// ============================================================================
// LOGGER
// ============================================================================

class Logger {
  constructor(config) {
    this.config = config;
    this.logFile = path.join(config.logsDir, 'orchestrator.log');
  }
  
  log(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data
    };
    
    const prefix = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
      success: '✅'
    }[level] || 'ℹ️';
    
    console.log(`${prefix} ${message}`);
    
    try {
      fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
    } catch (error) {
      // Silently fail on log write errors
    }
  }
  
  info(message, data) { this.log('info', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  error(message, data) { this.log('error', message, data); }
  debug(message, data) { this.log('debug', message, data); }
  success(message, data) { this.log('success', message, data); }
}

// ============================================================================
// HOOK MANAGER
// ============================================================================

class HookManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.hooks = new Map();
    this.hookGraph = new Map();
  }
  
  async discoverHooks() {
    this.logger.info('Discovering hooks...');
    
    if (!fs.existsSync(this.config.hooksDir)) {
      this.logger.warn(`Hooks directory not found: ${this.config.hooksDir}`);
      return;
    }
    
    const files = fs.readdirSync(this.config.hooksDir);
    const hookFiles = files.filter(f => f.endsWith('.kiro.hook') && !f.includes('.backup'));
    
    for (const hookFile of hookFiles) {
      try {
        const hookPath = path.join(this.config.hooksDir, hookFile);
        const hookData = JSON.parse(fs.readFileSync(hookPath, 'utf8'));
        const hookName = hookData.name;
        
        this.hooks.set(hookName, {
          ...hookData,
          filePath: hookPath,
          fileName: hookFile
        });
        
        this.logger.debug(`Discovered: ${hookName}`);
      } catch (error) {
        this.logger.error(`Failed to parse ${hookFile}: ${error.message}`);
      }
    }
    
    this.logger.success(`Discovered ${this.hooks.size} hooks`);
    await this.buildHookGraph();
  }
  
  async buildHookGraph() {
    for (const [hookName, hookData] of this.hooks) {
      const prompt = hookData.then?.prompt || '';
      const nextHooks = this.extractNextHooks(prompt);
      
      this.hookGraph.set(hookName, {
        nextHooks,
        dependencies: this.extractDependencies(hookData),
        metadata: hookData.metadata || {}
      });
    }
  }
  
  extractNextHooks(prompt) {
    const nextHookRegex = /\/hsy-[a-z-]+/g;
    const matches = prompt.match(nextHookRegex) || [];
    return [...new Set(matches)];
  }
  
  extractDependencies(hookData) {
    const deps = [];
    const prompt = hookData.then?.prompt || '';
    
    const fileRegex = /\.\/(docs|src|app|components)\/[a-zA-Z0-9_\/.-]+/g;
    const fileMatches = prompt.match(fileRegex) || [];
    
    fileMatches.forEach(file => {
      if (file.match(/\.(md|json|js|ts|tsx)$/)) {
        deps.push(file);
      }
    });
    
    return deps;
  }
  
  getHook(name) {
    return this.hooks.get(name);
  }
  
  getAllHooks() {
    return Array.from(this.hooks.values());
  }
  
  getNextPossibleHooks(currentHook) {
    const graph = this.hookGraph.get(currentHook);
    return graph ? graph.nextHooks : [];
  }
}

// ============================================================================
// STATE MANAGER
// ============================================================================

class StateManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.stateFile = path.join(config.stateDir, 'orchestrator-state.json');
    this.state = this.loadState();
  }
  
  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      }
    } catch (error) {
      this.logger.error(`Failed to load state: ${error.message}`);
    }
    
    return {
      version: '1.0.0',
      isRunning: false,
      currentHook: null,
      pendingHook: null,
      completedHooks: [],
      failedHooks: [],
      executionHistory: [],
      context: {
        projectPhase: 'initialization',
        lastDocumentUpdate: null,
        technicalDebt: [],
        userPreferences: {}
      },
      metrics: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        lastExecutionTime: null
      },
      humanInterventions: [],
      startTime: new Date().toISOString()
    };
  }
  
  saveState() {
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
    } catch (error) {
      this.logger.error(`Failed to save state: ${error.message}`);
    }
  }
  
  setPendingHook(hookName) {
    this.state.pendingHook = hookName;
    this.saveState();
  }
  
  clearPendingHook() {
    this.state.pendingHook = null;
    this.saveState();
  }
  
  addCompletedHook(hookName, executionData) {
    // Remove from pending
    if (this.state.pendingHook === hookName) {
      this.state.pendingHook = null;
    }
    
    // Clear current hook
    this.state.currentHook = null;
    
    // Add to completed
    this.state.completedHooks.push({
      hook: hookName,
      timestamp: new Date().toISOString(),
      ...executionData
    });
    
    this.state.executionHistory.push({
      hook: hookName,
      status: 'completed',
      timestamp: new Date().toISOString(),
      ...executionData
    });
    
    this.state.metrics.totalExecutions++;
    this.state.metrics.successfulExecutions++;
    this.state.metrics.lastExecutionTime = new Date().toISOString();
    this.saveState();
  }
  
  addFailedHook(hookName, error, executionData) {
    // Remove from pending
    if (this.state.pendingHook === hookName) {
      this.state.pendingHook = null;
    }
    
    // Clear current hook
    this.state.currentHook = null;
    
    this.state.failedHooks.push({
      hook: hookName,
      timestamp: new Date().toISOString(),
      error: error.message,
      ...executionData
    });
    
    this.state.executionHistory.push({
      hook: hookName,
      status: 'failed',
      timestamp: new Date().toISOString(),
      error: error.message,
      ...executionData
    });
    
    this.state.metrics.totalExecutions++;
    this.state.metrics.failedExecutions++;
    this.saveState();
  }
  
  isHookCompleted(hookName) {
    return this.state.completedHooks.some(h => h.hook === hookName);
  }
  
  isHookFailed(hookName) {
    return this.state.failedHooks.some(h => h.hook === hookName);
  }
  
  reset() {
    this.state = this.loadState();
    this.saveState();
    this.logger.info('State reset to initial values');
  }
}

// ============================================================================
// DECISION ENGINE
// ============================================================================

class DecisionEngine {
  constructor(hookManager, stateManager, logger) {
    this.hookManager = hookManager;
    this.stateManager = stateManager;
    this.logger = logger;
  }
  
  async decideNextHook() {
    const completedHooks = this.stateManager.state.completedHooks.map(h => h.hook);
    const failedHooks = this.stateManager.state.failedHooks.map(h => h.hook);
    
    this.logger.info(`\n${'═'.repeat(60)}`);
    this.logger.info('DECISION ENGINE: Analyzing next hook...');
    this.logger.info(`Completed hooks: ${completedHooks.length}`);
    this.logger.info(`Failed hooks: ${failedHooks.length}`);
    
    // If we have a pending hook, don't choose a new one
    if (this.stateManager.state.pendingHook) {
      this.logger.warn(`Pending hook exists: ${this.stateManager.state.pendingHook}`);
      this.logger.warn('Cannot choose new hook until pending hook completes');
      return null;
    }
    
    // Get the last completed hook
    const lastCompleted = completedHooks[completedHooks.length - 1];
    
    if (lastCompleted) {
      this.logger.info(`Last completed: ${lastCompleted}`);
      
      // Get suggested next hooks from the last completed hook
      const nextHooks = this.hookManager.getNextPossibleHooks(lastCompleted);
      this.logger.info(`Suggested next hooks: ${nextHooks.join(', ') || 'none'}`);
      
      if (nextHooks.length > 0) {
        // Filter out already completed hooks
        const freshHooks = nextHooks.filter(hook => 
          !completedHooks.includes(hook) && !failedHooks.includes(hook)
        );
        
        if (freshHooks.length > 0) {
          this.logger.success(`Chose: ${freshHooks[0]} (suggested by ${lastCompleted})`);
          this.logger.info(`${'═'.repeat(60)}\n`);
          return freshHooks[0];
        } else {
          this.logger.warn('All suggested hooks already completed');
        }
      }
    }
    
    // Otherwise, analyze project state to choose starting hook
    const startingHook = await this.chooseStartingHook();
    
    if (startingHook && !completedHooks.includes(startingHook) && !failedHooks.includes(startingHook)) {
      this.logger.success(`Chose: ${startingHook} (starting hook)`);
      this.logger.info(`${'═'.repeat(60)}\n`);
      return startingHook;
    }
    
    this.logger.warn('No suitable next hook found');
    this.logger.info(`${'═'.repeat(60)}\n`);
    return null;
  }
  
  async chooseStartingHook() {
    const hasDocs = await this.checkDocumentationExists();
    const hasPlan = await this.checkImplementationPlanExists();
    
    if (!hasDocs) {
      this.logger.info('No documentation found → /hsy-catchup');
      return '/hsy-catchup';
    } else if (!hasPlan) {
      this.logger.info('Documentation exists but no plan → /hsy-plan-setup');
      return '/hsy-plan-setup';
    } else if (hasPlan && !this.hasOngoingPlan()) {
      this.logger.info('Plan exists → /hsy-start-next-plan');
      return '/hsy-start-next-plan';
    } else {
      this.logger.info('Ongoing plan detected → /hsy-next-work-run');
      return '/hsy-next-work-run';
    }
  }
  
  async checkDocumentationExists() {
    const requiredFiles = [
      'goals_and_principles/GOALS_AND_PHILOSOPHY.md',
      'technical/TECH_STACK.md'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.stateManager.config.docsDir, file);
      if (!fs.existsSync(filePath)) {
        return false;
      }
    }
    
    return true;
  }
  
  async checkImplementationPlanExists() {
    const planningDir = path.join(this.stateManager.config.docsDir, 'planning');
    if (!fs.existsSync(planningDir)) return false;
    
    const planFiles = fs.readdirSync(planningDir);
    return planFiles.some(file => file.includes('IMPLEMENTATION_PLAN'));
  }
  
  hasOngoingPlan() {
    const planningDir = path.join(this.stateManager.config.docsDir, 'planning');
    if (!fs.existsSync(planningDir)) return false;
    
    const planFiles = fs.readdirSync(planningDir);
    return planFiles.some(file => file.includes('_ongoing.md'));
  }
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

class KiroOrchestrator extends EventEmitter {
  constructor(workspaceRoot) {
    super();
    this.config = new Config(workspaceRoot);
    this.logger = new Logger(this.config);
    this.hookManager = new HookManager(this.config, this.logger);
    this.stateManager = new StateManager(this.config, this.logger);
    this.decisionEngine = new DecisionEngine(this.hookManager, this.stateManager, this.logger);
    
    // Check if orchestrator was previously started
    this.isRunning = this.stateManager.state.isRunning || false;
    
    // If running, discover hooks
    if (this.isRunning) {
      this.hookManager.discoverHooks().catch(() => {
        // Silently fail, will be discovered on next start
      });
    }
  }
  
  async start() {
    if (this.isRunning) {
      this.logger.warn('Orchestrator is already running');
      return;
    }
    
    this.isRunning = true;
    this.logger.info('\n╔════════════════════════════════════════════════════════════╗');
    this.logger.info('║  HSY Autonomous Orchestrator - PRODUCTION MODE            ║');
    this.logger.info('╚════════════════════════════════════════════════════════════╝\n');
    
    await this.hookManager.discoverHooks();
    
    // Mark as started in state
    this.stateManager.state.isRunning = true;
    this.stateManager.saveState();
    
    this.logger.success('Orchestrator started successfully');
    this.logger.info(`Workspace: ${this.config.workspaceRoot}`);
    this.logger.info(`Hooks: ${this.hookManager.hooks.size}`);
    this.logger.info(`Mode: ${this.config.mode}\n`);
    
    this.emit('started');
    
    return {
      status: 'started',
      mode: this.config.mode,
      hooksCount: this.hookManager.hooks.size,
      workspace: this.config.workspaceRoot
    };
  }
  
  async stop() {
    this.isRunning = false;
    this.stateManager.state.isRunning = false;
    this.stateManager.saveState();
    this.logger.info('Orchestrator stopped');
    this.emit('stopped');
  }
  
  /**
   * Decide and prepare the next hook for execution
   * Returns instructions for the user to trigger it in Kiro
   */
  async prepareNextHook() {
    if (!this.isRunning) {
      return { status: 'stopped', message: 'Orchestrator is not running' };
    }
    
    try {
      const nextHookName = await this.decisionEngine.decideNextHook();
      
      if (!nextHookName) {
        return { 
          status: 'no_hook', 
          message: 'No next hook to execute. Workflow may be complete or awaiting pending hook completion.' 
        };
      }
      
      const hookData = this.hookManager.getHook(nextHookName);
      if (!hookData) {
        this.logger.error(`Hook not found: ${nextHookName}`);
        return { status: 'error', message: `Hook not found: ${nextHookName}` };
      }
      
      // Mark as pending
      this.stateManager.setPendingHook(nextHookName);
      this.stateManager.state.currentHook = nextHookName;
      this.stateManager.saveState();
      
      // Create instruction file for user
      const instructionFile = path.join(
        this.config.stateDir,
        'NEXT_HOOK_INSTRUCTIONS.md'
      );
      
      const instructions = this.generateInstructions(hookData);
      fs.writeFileSync(instructionFile, instructions);
      
      this.logger.info('\n' + '═'.repeat(60));
      this.logger.success(`NEXT HOOK READY: ${nextHookName}`);
      this.logger.info('═'.repeat(60));
      this.logger.info('\n📋 TO EXECUTE THIS HOOK:\n');
      this.logger.info(`1. Open Kiro's Agent Hooks panel`);
      this.logger.info(`2. Find hook: ${hookData.fileName}`);
      this.logger.info(`3. Click "Trigger Hook" or use command palette`);
      this.logger.info(`\nOR manually send this to Kiro's agent:\n`);
      this.logger.info(`"Execute hook: ${nextHookName}"`);
      this.logger.info('\n' + '═'.repeat(60));
      this.logger.info(`\n📄 Full instructions: ${instructionFile}\n`);
      
      return {
        status: 'ready',
        hook: nextHookName,
        hookFile: hookData.fileName,
        hookPath: hookData.filePath,
        instructions: instructionFile,
        message: `Hook ${nextHookName} is ready for execution`
      };
      
    } catch (error) {
      this.logger.error(`Failed to prepare next hook: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }
  
  generateInstructions(hookData) {
    return `# HSY Orchestrator - Next Hook Instructions

## Hook to Execute

**Name:** ${hookData.name}
**File:** ${hookData.fileName}
**Path:** ${hookData.filePath}

## How to Execute

### Option 1: Using Kiro's Hook Panel
1. Open the Agent Hooks panel in Kiro
2. Find the hook: \`${hookData.fileName}\`
3. Click "Trigger Hook" button

### Option 2: Using Command Palette
1. Open Kiro's command palette (Cmd/Ctrl + Shift + P)
2. Search for "Trigger Hook"
3. Select: \`${hookData.name}\`

### Option 3: Manual Agent Prompt
Send this message to Kiro's agent:

\`\`\`
Execute hook: ${hookData.name}
\`\`\`

## After Execution

Once the hook completes, run:

\`\`\`bash
hsy complete ${hookData.name}
\`\`\`

This will mark the hook as completed and prepare the next one.

## Hook Description

${hookData.description || 'No description available'}

## Estimated Duration

${hookData.metadata?.autonomy?.estimatedDuration || 'Unknown'}

---

Generated: ${new Date().toISOString()}
`;
  }
  
  /**
   * Mark a hook as completed
   */
  async markCompleted(hookName, result = {}) {
    this.logger.info(`Marking hook as completed: ${hookName}`);
    
    this.stateManager.addCompletedHook(hookName, {
      result,
      completedAt: new Date().toISOString()
    });
    
    this.logger.success(`Hook completed: ${hookName}`);
    
    // Clean up instruction file
    const instructionFile = path.join(
      this.config.stateDir,
      'NEXT_HOOK_INSTRUCTIONS.md'
    );
    if (fs.existsSync(instructionFile)) {
      fs.unlinkSync(instructionFile);
    }
    
    return { status: 'completed', hook: hookName };
  }
  
  /**
   * Mark a hook as failed
   */
  async markFailed(hookName, error) {
    this.logger.error(`Marking hook as failed: ${hookName}`);
    
    this.stateManager.addFailedHook(hookName, error, {
      failedAt: new Date().toISOString()
    });
    
    return { status: 'failed', hook: hookName, error: error.message };
  }
  
  getStatus() {
    return {
      isRunning: this.isRunning,
      mode: this.config.mode,
      pendingHook: this.stateManager.state.pendingHook,
      currentHook: this.stateManager.state.currentHook,
      completedCount: this.stateManager.state.completedHooks.length,
      failedCount: this.stateManager.state.failedHooks.length,
      metrics: this.stateManager.state.metrics,
      context: this.stateManager.state.context,
      hooksCount: this.hookManager.hooks.size
    };
  }
  
  async reset() {
    this.stateManager.reset();
    this.logger.info('Orchestrator state reset');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  KiroOrchestrator,
  Config,
  HookManager,
  StateManager,
  DecisionEngine,
  Logger
};

// ============================================================================
// CLI INTERFACE
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  const orchestrator = new KiroOrchestrator();
  
  async function runCommand() {
    switch (command) {
      case 'start':
        await orchestrator.start();
        break;
        
      case 'next':
        const result = await orchestrator.prepareNextHook();
        if (result.status !== 'ready') {
          console.log(JSON.stringify(result, null, 2));
        }
        break;
        
      case 'complete':
        const hookName = args[1];
        if (!hookName) {
          console.error('Usage: node kiro-orchestrator.js complete <hook-name>');
          process.exit(1);
        }
        const completeResult = await orchestrator.markCompleted(hookName);
        console.log(JSON.stringify(completeResult, null, 2));
        break;
        
      case 'failed':
        const failedHookName = args[1];
        const errorMsg = args[2] || 'Unknown error';
        if (!failedHookName) {
          console.error('Usage: node kiro-orchestrator.js failed <hook-name> [error-message]');
          process.exit(1);
        }
        const failedResult = await orchestrator.markFailed(failedHookName, new Error(errorMsg));
        console.log(JSON.stringify(failedResult, null, 2));
        break;
        
      case 'status':
        const status = orchestrator.getStatus();
        console.log(JSON.stringify(status, null, 2));
        break;
        
      case 'stop':
        await orchestrator.stop();
        break;
        
      case 'reset':
        await orchestrator.reset();
        break;
        
      case 'help':
      default:
        console.log(`
HSY Autonomous Orchestrator (Kiro Native) - PRODUCTION

Commands:
  start     - Start the orchestrator
  next      - Prepare the next hook for execution
  complete  - Mark a hook as completed
  failed    - Mark a hook as failed
  status    - Show current status
  stop      - Stop the orchestrator
  reset     - Reset orchestrator state
  help      - Show this help

Usage:
  node kiro-orchestrator.js <command> [args]
        `);
    }
  }
  
  runCommand().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
