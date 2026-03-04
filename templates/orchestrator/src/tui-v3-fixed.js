#!/usr/bin/env node

/**
 * HSY TUI v3.0 - FIXED VERSION
 * 
 * Fixes:
 * - UI alignment issues
 * - Real-time streaming of model thinking
 * - Actual hook execution
 * - Node-graph history visualization
 */

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const fs = require('fs');
const path = require('path');

// Import components
const { KiroOrchestrator } = require('./kiro-orchestrator.js');
const { ModelRouter, AIOrchestrator } = require('./ai-orchestrator.js');
const kiroIntegration = require('./kiro-integration.js');

class HSYTUIV3Fixed {
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
    this.streamingBuffer = [];
    this.thinkingBuffer = [];
    this.autoRefreshInterval = null;
    this.executionHistory = [];
    
    // Initialize UI
    this.setupScreen();
    this.setupLayout();
    this.setupEventHandlers();
    this.setupOrchestratorEvents();
  }
  
  setupScreen() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'HSY Autonomous Orchestrator v3.0 - FIXED',
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
    // Use fixed pixel-perfect layout
    const width = this.screen.width;
    const height = this.screen.height;
    
    // Header (2 rows)
    this.header = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: this.getASCIIBanner(),
      tags: true,
      border: { type: 'line', fg: 'cyan' },
      style: { fg: 'cyan', border: { fg: 'cyan' } }
    });
    
    // Top row - 3 equal panels
    const panelWidth = Math.floor((width - 6) / 3); // Account for borders
    
    // Status panel (left)
    this.statusBox = blessed.box({
      parent: this.screen,
      top: 3,
      left: 0,
      width: panelWidth,
      height: 8,
      label: ' 📊 Status ',
      content: '',
      tags: true,
      border: { type: 'line', fg: 'green' },
      style: { fg: 'white', border: { fg: 'green' } },
      scrollable: true,
      mouse: true
    });
    
    // Model panel (middle)
    this.modelBox = blessed.box({
      parent: this.screen,
      top: 3,
      left: panelWidth,
      width: panelWidth,
      height: 8,
      label: ' 🤖 Models ',
      content: '',
      tags: true,
      border: { type: 'line', fg: 'magenta' },
      style: { fg: 'white', border: { fg: 'magenta' } },
      mouse: true
    });
    
    // Metrics panel with NODE GRAPH (right)
    this.metricsBox = blessed.box({
      parent: this.screen,
      top: 3,
      left: panelWidth * 2,
      width: panelWidth + 6, // Take remaining space
      height: 8,
      label: ' 📈 Metrics & History Graph ',
      content: '',
      tags: true,
      border: { type: 'line', fg: 'yellow' },
      style: { fg: 'white', border: { fg: 'yellow' } },
      scrollable: true,
      mouse: true
    });
    
    // Execution panel with LIVE STREAMING (middle)
    this.executionBox = blessed.box({
      parent: this.screen,
      top: 11,
      left: 0,
      width: '100%',
      height: height - 16,
      label: ' 🎯 Current Execution - LIVE STREAM ',
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
    this.logBox = blessed.log({
      parent: this.screen,
      bottom: 2,
      left: 0,
      width: '100%',
      height: height - (height - 16) - 14,
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
    this.controlBox = blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 2,
      content: this.getControlsText(),
      tags: true,
      border: { type: 'line', fg: 'white' },
      style: { fg: 'white', border: { fg: 'white' } }
    });
  }
  
  setupEventHandlers() {
    // Keyboard shortcuts
    this.screen.key(['s'], () => this.toggleOrchestrator());
    this.screen.key(['p'], () => this.togglePause());
    this.screen.key(['m'], () => this.showModelSettings());
    this.screen.key(['h'], () => this.showHistory());
    this.screen.key(['e'], () => this.executeNextHook()); // MANUAL EXECUTE
    
    // Mouse support
    this.modelBox.on('click', () => this.showModelSettings());
    this.metricsBox.on('click', () => this.showHistory());
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
      this.addLog('info', `Executing: ${data.hook}`);
      this.addThinking(`Starting hook: ${data.hook}`);
      this.refresh();
    });
    
    this.aiOrchestrator.on('hookCompleted', (data) => {
      this.addLog('success', `Completed: ${data.hook}`);
      this.executionHistory.push({
        hook: data.hook,
        status: 'completed',
        timestamp: new Date(),
        result: data.result
      });
      // Clear streaming buffers after completion
      this.thinkingBuffer = [];
      this.streamingBuffer = [];
      this.refresh();
    });
    
    this.aiOrchestrator.on('thinking', (data) => {
      this.addThinking(data.message);
    });
    
    this.aiOrchestrator.on('executing', (data) => {
      this.addExecution(data.message);
    });
    
    this.aiOrchestrator.on('error', (error) => {
      this.addLog('error', `Error: ${error.message}`);
      this.refresh();
    });
    
    // Connect executor events to orchestrator events
    this.aiOrchestrator.executor.on('thinking', (data) => {
      this.aiOrchestrator.emit('thinking', data);
    });
    
    this.aiOrchestrator.executor.on('executing', (data) => {
      this.aiOrchestrator.emit('executing', data);
    });
    
    this.aiOrchestrator.executor.on('error', (data) => {
      this.aiOrchestrator.emit('error', data);
    });
  }
  
  getASCIIBanner() {
    return `{center}{cyan-fg}{bold}
╦ ╦╔═╗╦ ╦  ╔═╗╦═╗╔═╗╦ ╦╔═╗╔═╗╔╦╗╦═╗╔═╗╔╦╗╔═╗╦═╗
╠═╣╚═╗╚╦╝  ║ ║╠╦╝║  ╠═╣║╣ ╚═╗ ║ ╠╦╝╠═╣ ║ ║ ║╠╦╝
╩ ╩╚═╝ ╩   ╚═╝╩╚═╚═╝╩ ╩╚═╝╚═╝ ╩ ╩╚═╩ ╩ ╩ ╚═╝╩╚═
{/bold}{/cyan-fg}
{white-fg}v3.0 - FIXED - Live Streaming & Node Graph{/white-fg}{/center}`;
  }
  
  getControlsText() {
    return `{center}{white-fg}[S]tart/Stop  [P]ause  [E]xecute Next  [M]odels  [H]istory  [R]efresh  [Q]uit{/white-fg}{/center}`;
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
  
  addThinking(message) {
    const timestamp = new Date().toLocaleTimeString();
    this.thinkingBuffer.push(`[${timestamp}] 🧠 ${message}`);
    if (this.thinkingBuffer.length > 20) {
      this.thinkingBuffer.shift();
    }
    this.updateExecutionDisplay();
  }
  
  addExecution(message) {
    const timestamp = new Date().toLocaleTimeString();
    this.streamingBuffer.push(`[${timestamp}] ⚙️  ${message}`);
    if (this.streamingBuffer.length > 20) {
      this.streamingBuffer.shift();
    }
    this.updateExecutionDisplay();
  }
  
  updateExecutionDisplay() {
    let content = '';
    
    if (this.thinkingBuffer.length > 0) {
      content += '{bold}{cyan-fg}🧠 Model Thinking (Live):{/cyan-fg}{/bold}\n';
      this.thinkingBuffer.forEach(line => {
        content += `  {gray-fg}${line}{/gray-fg}\n`;
      });
      content += '\n';
    }
    
    if (this.streamingBuffer.length > 0) {
      content += '{bold}{green-fg}⚙️  Executing (Live):{/green-fg}{/bold}\n';
      this.streamingBuffer.forEach(line => {
        content += `  {white-fg}${line}{/white-fg}\n`;
      });
    }
    
    if (this.thinkingBuffer.length === 0 && this.streamingBuffer.length === 0) {
      const status = this.aiOrchestrator.getStatus();
      if (status.pendingHook) {
        content = `{bold}{yellow-fg}⏳ Preparing: ${status.pendingHook}{/yellow-fg}{/bold}\n\n`;
        content += `{gray-fg}Waiting for execution to start...{/gray-fg}`;
      } else if (status.aiOrchestrator.isRunning) {
        content = `{bold}{green-fg}✅ Ready{/green-fg}{/bold}\n\n`;
        content += `{gray-fg}Orchestrator is analyzing project state...{/gray-fg}`;
      } else {
        content = `{bold}Orchestrator not running{/bold}\n\n`;
        content += `{gray-fg}Press [S] to start or [E] to execute next hook manually{/gray-fg}`;
      }
    }
    
    this.executionBox.setContent(content);
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
  
  async executeNextHook() {
    this.addLog('info', 'Manually executing next hook...');
    
    try {
      // Prepare next hook
      const nextHookResult = await this.baseOrchestrator.prepareNextHook();
      
      if (nextHookResult.status !== 'ready') {
        this.addLog('warn', `Cannot execute: ${nextHookResult.message}`);
        return;
      }
      
      const hookData = this.baseOrchestrator.hookManager.getHook(nextHookResult.hook);
      
      if (!hookData) {
        this.addLog('error', `Hook not found: ${nextHookResult.hook}`);
        return;
      }
      
      this.addLog('info', `Executing: ${nextHookResult.hook}`);
      
      // Use the AI orchestrator's executor for real execution
      const context = {
        projectPhase: this.baseOrchestrator.stateManager.state.context.projectPhase,
        completedHooks: this.baseOrchestrator.stateManager.state.completedHooks.map(h => h.hook)
      };
      
      // Execute using the real executor (which will emit streaming events)
      const result = await this.aiOrchestrator.executor.executeHook(hookData, context);
      
      // Mark as completed
      await this.baseOrchestrator.markCompleted(nextHookResult.hook, result);
      
      this.executionHistory.push({
        hook: nextHookResult.hook,
        status: 'completed',
        timestamp: new Date(),
        result
      });
      
      this.addLog('success', `Completed: ${nextHookResult.hook}`);
      
      // Clear streaming buffers after a delay
      setTimeout(() => {
        this.thinkingBuffer = [];
        this.streamingBuffer = [];
        this.refresh();
      }, 3000);
      
      this.refresh();
      
    } catch (error) {
      this.addLog('error', `Execution failed: ${error.message}`);
      this.thinkingBuffer = [];
      this.streamingBuffer = [];
      this.refresh();
    }
  }
  
  showModelSettings() {
    // Show model settings overlay
    this.addLog('info', 'Model settings - Press M to change presets');
    // TODO: Implement overlay
  }
  
  showHistory() {
    // Show execution history
    this.addLog('info', 'Execution history - See metrics panel');
    this.refresh();
  }
  
  generateNodeGraph() {
    if (this.executionHistory.length === 0) {
      return '{center}{yellow-fg}No execution history yet{/yellow-fg}{/center}\n\n{center}{gray-fg}Hooks will appear here as they execute{/gray-fg}{/center}';
    }
    
    let graph = '{bold}{cyan-fg}Hook Execution Flow:{/cyan-fg}{/bold}\n\n';
    
    this.executionHistory.slice(-5).forEach((item, index) => {
      const isLast = index === this.executionHistory.slice(-5).length - 1;
      const status = item.status === 'completed' ? '{green-fg}✅{/green-fg}' : 
                    item.status === 'failed' ? '{red-fg}❌{/red-fg}' : '{yellow-fg}⚙️{/yellow-fg}';
      
      // Node box
      graph += '  ┌─────────────────┐\n';
      graph += `  │ ${item.hook.substring(0, 15).padEnd(15)} │ ${status}\n`;
      graph += '  └─────────────────┘\n';
      
      if (!isLast) {
        graph += '         │\n';
        graph += '         ▼\n';
      }
    });
    
    return graph;
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
    statusContent += `{bold}Completed:{/bold}\n${status.completedCount || 0} hooks`;
    
    this.statusBox.setContent(statusContent);
    
    // Update model panel
    const preset = this.modelRouter.getPresetInfo();
    let modelContent = '';
    modelContent += `{bold}Preset:{/bold}\n{cyan-fg}${preset.name}{/cyan-fg}\n\n`;
    modelContent += `{bold}Orchestrator:{/bold}\n{gray-fg}${preset.orchestrator}{/gray-fg}\n\n`;
    modelContent += `{bold}Executor:{/bold}\n{gray-fg}${preset.executor}{/gray-fg}\n\n`;
    modelContent += `{bold}Auditor:{/bold}\n{gray-fg}${preset.auditor}{/gray-fg}`;
    
    this.modelBox.setContent(modelContent);
    
    // Update metrics panel with NODE GRAPH
    let metricsContent = '';
    metricsContent += `{bold}Total:{/bold} ${status.metrics?.totalExecutions || 0}\n`;
    metricsContent += `{green-fg}✅ Success: ${status.completedCount || 0}{/green-fg}\n`;
    metricsContent += `{red-fg}❌ Failed: ${status.failedCount || 0}{/red-fg}\n\n`;
    
    metricsContent += this.generateNodeGraph();
    
    this.metricsBox.setContent(metricsContent);
    
    // Update execution display
    this.updateExecutionDisplay();
    
    this.screen.render();
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    this.addLog('info', 'HSY TUI v3.0 FIXED started');
    this.addLog('info', 'Press [S] to start orchestrator, [E] to execute next hook manually');
    
    // Initial refresh
    this.refresh();
    
    // Auto-refresh every 1 second
    this.autoRefreshInterval = setInterval(() => {
      this.refresh();
    }, 1000);
    
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
  const tui = new HSYTUIV3Fixed(workspaceRoot);
  
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

module.exports = { HSYTUIV3Fixed };
