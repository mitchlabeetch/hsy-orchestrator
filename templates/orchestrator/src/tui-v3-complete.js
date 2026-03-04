#!/usr/bin/env node

/**
 * HSY TUI v3.0 - Complete Implementation
 * 
 * Fully autonomous, AI-powered terminal interface with:
 * - Model routing settings
 * - Execution history visualization
 * - User question handling
 * - Real-time streaming
 * - Comprehensive monitoring
 */

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const fs = require('fs');
const path = require('path');

// Import components
const { KiroOrchestrator } = require('./kiro-orchestrator.js');
const { ModelRouter, AIOrchestrator } = require('./ai-orchestrator.js');
const {
  ModelSettingsOverlay,
  ExecutionHistoryOverlay,
  UserQuestionsOverlay,
  StreamingDisplay
} = require('./tui-components.js');

class HSYTUIV3 {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    
    // Initialize orchestrators
    this.baseOrchestrator = new KiroOrchestrator(workspaceRoot);
    this.modelRouter = new ModelRouter();
    this.aiOrchestrator = new AIOrchestrator(
      this.baseOrchestrator,
      this.modelRouter,
      this.baseOrchestrator.logger
    );
    
    // UI state
    this.logBuffer = [];
    this.maxLogLines = 100;
    this.autoRefreshInterval = null;
    
    // Initialize UI
    this.setupScreen();
    this.setupLayout();
    this.setupComponents();
    this.setupEventHandlers();
    this.setupOrchestratorEvents();
  }
  
  setupScreen() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'HSY Autonomous Orchestrator v3.0',
      fullUnicode: true,
      dockBorders: true,
      cursor: {
        artificial: true,
        shape: 'line',
        blink: true,
        color: 'white'
      }
    });
    
    // Global key handlers
    this.screen.key(['escape', 'q', 'C-c'], () => this.shutdown());
    this.screen.key(['r'], () => this.refresh());
  }
  
  setupLayout() {
    this.grid = new contrib.grid({
      rows: 12,
      cols: 12,
      screen: this.screen
    });
    
    // Header with ASCII banner
    this.header = this.grid.set(0, 0, 2, 12, blessed.box, {
      label: '',
      content: this.getASCIIBanner(),
      tags: true,
      border: { type: 'line', fg: 'cyan' },
      style: { fg: 'cyan', border: { fg: 'cyan' } }
    });
    
    // Status panel (top left)
    this.statusBox = this.grid.set(2, 0, 3, 4, blessed.box, {
      label: ' 📊 Status ',
      content: '',
      tags: true,
      border: { type: 'line', fg: 'green' },
      style: { fg: 'white', border: { fg: 'green' } },
      scrollable: true,
      mouse: true
    });
    
    // Model panel (top middle)
    this.modelBox = this.grid.set(2, 4, 3, 4, blessed.box, {
      label: ' 🤖 Models ',
      content: '',
      tags: true,
      border: { type: 'line', fg: 'magenta' },
      style: { fg: 'white', border: { fg: 'magenta' } },
      mouse: true
    });
    
    // Metrics panel (top right)
    this.metricsBox = this.grid.set(2, 8, 3, 4, blessed.box, {
      label: ' 📈 Metrics ',
      content: '',
      tags: true,
      border: { type: 'line', fg: 'yellow' },
      style: { fg: 'white', border: { fg: 'yellow' } }
    });
    
    // Current execution panel (middle)
    this.executionBox = this.grid.set(5, 0, 3, 12, blessed.box, {
      label: ' 🎯 Current Execution ',
      content: '',
      tags: true,
      border: { type: 'line', fg: 'blue' },
      style: { fg: 'white', border: { fg: 'blue' } },
      scrollable: true,
      alwaysScroll: true,
      scrollbar: { ch: '█', style: { fg: 'blue' } },
      mouse: true
    });
    
    // Activity log (bottom)
    this.logBox = this.grid.set(8, 0, 3, 12, blessed.log, {
      label: ' 📝 Activity Log ',
      tags: true,
      border: { type: 'line', fg: 'cyan' },
      style: { fg: 'white', border: { fg: 'cyan' } },
      scrollable: true,
      alwaysScroll: true,
      scrollbar: { ch: '█', style: { fg: 'cyan' } },
      mouse: true
    });
    
    // Control panel (bottom)
    this.controlBox = this.grid.set(11, 0, 1, 12, blessed.box, {
      label: '',
      content: this.getControlsText(),
      tags: true,
      border: { type: 'line', fg: 'white' },
      style: { fg: 'white', border: { fg: 'white' } }
    });
  }
  
  setupComponents() {
    // Streaming display
    this.streamingDisplay = new StreamingDisplay(this.executionBox);
    
    // Overlays
    this.modelSettings = new ModelSettingsOverlay(
      this.screen,
      this.modelRouter,
      () => this.refresh()
    );
    
    this.historyOverlay = new ExecutionHistoryOverlay(
      this.screen,
      this.aiOrchestrator,
      () => this.refresh()
    );
    
    this.questionsOverlay = new UserQuestionsOverlay(
      this.screen,
      this.aiOrchestrator,
      (index, answer) => this.handleAnswer(index, answer)
    );
  }
  
  setupEventHandlers() {
    // Keyboard shortcuts
    this.screen.key(['s'], () => this.toggleOrchestrator());
    this.screen.key(['p'], () => this.togglePause());
    this.screen.key(['m'], () => this.modelSettings.show());
    this.screen.key(['h'], () => this.historyOverlay.show());
    this.screen.key(['?'], () => this.showQuestions());
    
    // Mouse support
    this.modelBox.on('click', () => this.modelSettings.show());
    this.logBox.on('click', () => this.logBox.focus());
  }
  
  setupOrchestratorEvents() {
    // Intercept logs
    const originalLog = this.baseOrchestrator.logger.log.bind(this.baseOrchestrator.logger);
    this.baseOrchestrator.logger.log = (level, message, data) => {
      originalLog(level, message, data);
      this.addLog(level, message, data);
    };
    
    // AI Orchestrator events
    this.aiOrchestrator.on('started', (data) => {
      this.addLog('success', `AI Orchestrator started - Scenario: ${data.scenario.type}`);
      this.refresh();
    });
    
    this.aiOrchestrator.on('hookStarting', (data) => {
      this.addLog('info', `Auto-executing: ${data.hook}`);
      this.streamingDisplay.clear();
      this.refresh();
    });
    
    this.aiOrchestrator.on('hookCompleted', (data) => {
      this.addLog('success', `Completed: ${data.hook}`);
      this.refresh();
    });
    
    this.aiOrchestrator.on('questionRequired', (data) => {
      this.addLog('warn', `User input required for: ${data.hook}`);
      this.showQuestions();
      this.refresh();
    });
    
    this.aiOrchestrator.on('paused', () => {
      this.addLog('warn', 'Orchestrator paused');
      this.refresh();
    });
    
    this.aiOrchestrator.on('resumed', () => {
      this.addLog('info', 'Orchestrator resumed');
      this.refresh();
    });
    
    this.aiOrchestrator.on('workflowComplete', () => {
      this.addLog('success', 'Workflow complete! All hooks executed.');
      this.refresh();
    });
    
    this.aiOrchestrator.on('error', (error) => {
      this.addLog('error', `Error: ${error.message}`);
      this.refresh();
    });
  }
  
  getASCIIBanner() {
    return `{center}{cyan-fg}{bold}
╦ ╦╔═╗╦ ╦  ╔═╗╦═╗╔═╗╦ ╦╔═╗╔═╗╔╦╗╦═╗╔═╗╔╦╗╔═╗╦═╗
╠═╣╚═╗╚╦╝  ║ ║╠╦╝║  ╠═╣║╣ ╚═╗ ║ ╠╦╝╠═╣ ║ ║ ║╠╦╝
╩ ╩╚═╝ ╩   ╚═╝╩╚═╚═╝╩ ╩╚═╝╚═╝ ╩ ╩╚═╩ ╩ ╩ ╚═╝╩╚═
{/bold}{/cyan-fg}
{white-fg}v3.0 - Autonomous AI Edition{/white-fg}{/center}`;
  }
  
  getControlsText() {
    return `{center}{white-fg}[S]tart/Stop  [P]ause  [M]odels  [H]istory  [?]Questions  [R]efresh  [Q]uit{/white-fg}{/center}`;
  }
  
  addLog(level, message, data = {}) {
    const timestamp = new Date().toLocaleTimeString();
    const icons = {
      success: '✅',
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🔍'
    };
    
    const colors = {
      success: 'green',
      error: 'red',
      warn: 'yellow',
      info: 'white',
      debug: 'cyan'
    };
    
    const icon = icons[level] || 'ℹ️';
    const color = colors[level] || 'white';
    
    let logLine = `{${color}-fg}[${timestamp}] ${icon} ${message}{/${color}-fg}`;
    
    this.logBuffer.push(logLine);
    if (this.logBuffer.length > this.maxLogLines) {
      this.logBuffer.shift();
    }
    
    this.logBox.log(logLine);
    this.screen.render();
  }
  
  async toggleOrchestrator() {
    const status = this.aiOrchestrator.getStatus();
    
    if (status.aiOrchestrator.isRunning) {
      await this.aiOrchestrator.stop();
      this.addLog('info', 'Orchestrator stopped');
    } else {
      await this.aiOrchestrator.start();
      this.addLog('success', 'Orchestrator started');
    }
    
    this.refresh();
  }
  
  togglePause() {
    const status = this.aiOrchestrator.getStatus();
    
    if (status.aiOrchestrator.isPaused) {
      this.aiOrchestrator.resume();
    } else {
      this.aiOrchestrator.pause();
    }
    
    this.refresh();
  }
  
  showQuestions() {
    const questions = this.aiOrchestrator.userQuestions;
    if (questions && questions.length > 0) {
      this.questionsOverlay.show(questions);
    } else {
      this.addLog('info', 'No pending questions');
    }
  }
  
  handleAnswer(index, answer) {
    this.aiOrchestrator.answerQuestion(index, answer);
    this.addLog('success', `Question answered: ${answer}`);
    this.refresh();
  }
  
  refresh() {
    const status = this.aiOrchestrator.getStatus();
    
    // Update status panel
    let statusContent = '';
    statusContent += `{bold}Running:{/bold} ${status.aiOrchestrator.isRunning ? '{green-fg}✅ Yes{/green-fg}' : '{red-fg}❌ No{/red-fg}'}\n`;
    statusContent += `{bold}Mode:{/bold} ${status.aiOrchestrator.isPaused ? '{yellow-fg}⏸️  Paused{/yellow-fg}' : '{green-fg}▶️  Active{/green-fg}'}\n\n`;
    
    if (status.pendingHook) {
      statusContent += `{yellow-fg}{bold}⏳ Pending:{/bold}\n${status.pendingHook}{/yellow-fg}\n\n`;
    }
    
    statusContent += `{bold}Phase:{/bold}\n${status.context?.projectPhase || 'unknown'}\n\n`;
    statusContent += `{bold}Questions:{/bold}\n${status.aiOrchestrator.pendingQuestions} pending`;
    
    this.statusBox.setContent(statusContent);
    
    // Update model panel
    const preset = this.modelRouter.getPresetInfo();
    let modelContent = '';
    modelContent += `{bold}Preset:{/bold}\n{cyan-fg}${preset.name}{/cyan-fg}\n\n`;
    modelContent += `{bold}Orchestrator:{/bold}\n{gray-fg}${preset.orchestrator}{/gray-fg}\n\n`;
    modelContent += `{bold}Executor:{/bold}\n{gray-fg}${preset.executor}{/gray-fg}\n\n`;
    modelContent += `{bold}Auditor:{/bold}\n{gray-fg}${preset.auditor}{/gray-fg}\n\n`;
    modelContent += `{center}{gray-fg}Press [M] to change{/gray-fg}{/center}`;
    
    this.modelBox.setContent(modelContent);
    
    // Update metrics panel
    let metricsContent = '';
    metricsContent += `{bold}Total:{/bold} ${status.metrics?.totalExecutions || 0}\n\n`;
    metricsContent += `{green-fg}{bold}✅ Success:{/bold}\n  ${status.completedCount || 0}{/green-fg}\n\n`;
    metricsContent += `{red-fg}{bold}❌ Failed:{/bold}\n  ${status.failedCount || 0}{/red-fg}\n\n`;
    metricsContent += `{yellow-fg}{bold}⚙️  Running:{/bold}\n  ${status.pendingHook ? 1 : 0}{/yellow-fg}\n\n`;
    metricsContent += `{center}{gray-fg}Press [H] for history{/gray-fg}{/center}`;
    
    this.metricsBox.setContent(metricsContent);
    
    // Update execution panel (if not streaming)
    if (this.streamingDisplay.thinkingBuffer.length === 0 && 
        this.streamingDisplay.executionBuffer.length === 0) {
      let execContent = '';
      
      if (status.pendingHook) {
        const hookData = this.baseOrchestrator.hookManager.getHook(status.pendingHook);
        execContent += `{bold}{magenta-fg}${status.pendingHook}{/magenta-fg}{/bold}\n\n`;
        execContent += `{bold}Status:{/bold} {yellow-fg}⚙️  Executing...{/yellow-fg}\n\n`;
        execContent += `{bold}Model:{/bold} {cyan-fg}${this.modelRouter.getModel('executor')}{/cyan-fg}\n\n`;
        execContent += `{gray-fg}Execution in progress...{/gray-fg}`;
      } else if (status.aiOrchestrator.isRunning) {
        execContent += `{bold}Ready for next hook{/bold}\n\n`;
        execContent += `{gray-fg}Orchestrator is analyzing project state...{/gray-fg}`;
      } else {
        execContent += `{bold}Orchestrator not running{/bold}\n\n`;
        execContent += `{gray-fg}Press [S] to start{/gray-fg}`;
      }
      
      this.executionBox.setContent(execContent);
    }
    
    this.screen.render();
  }
  
  async shutdown() {
    this.addLog('info', 'Shutting down...');
    
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    
    await this.aiOrchestrator.stop();
    this.screen.destroy();
    process.exit(0);
  }
  
  async run() {
    this.addLog('info', 'HSY TUI v3.0 started');
    this.addLog('info', 'Press [S] to start orchestrator, [H] for help');
    
    // Auto-start orchestrator
    await this.aiOrchestrator.start();
    
    // Initial refresh
    this.refresh();
    
    // Auto-refresh every 2 seconds
    this.autoRefreshInterval = setInterval(() => {
      this.refresh();
    }, 2000);
    
    this.screen.render();
  }
}

// ============================================================================
// MAIN
// ============================================================================

if (require.main === module) {
  function findWorkspaceRoot() {
    let currentDir = process.cwd();
    
    while (currentDir !== '/') {
      if (fs.existsSync(path.join(currentDir, '.kiro'))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    
    return process.cwd();
  }
  
  const workspaceRoot = findWorkspaceRoot();
  const tui = new HSYTUIV3(workspaceRoot);
  
  // Handle errors
  process.on('uncaughtException', (error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
  });
  
  tui.run().catch(error => {
    console.error('Failed to start TUI:', error);
    process.exit(1);
  });
}

module.exports = { HSYTUIV3 };
