#!/usr/bin/env node

/**
 * TUI Components - Reusable UI components for HSY TUI v3
 */

const blessed = require('blessed');

// ============================================================================
// MODEL SETTINGS COMPONENT
// ============================================================================

class ModelSettingsOverlay {
  constructor(screen, modelRouter, onClose) {
    this.screen = screen;
    this.modelRouter = modelRouter;
    this.onClose = onClose;
    this.selectedPreset = 0;
    this.selectedRole = null;
    this.presets = modelRouter.getAllPresets();
    
    this.createOverlay();
  }
  
  createOverlay() {
    this.box = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '70%',
      height: '70%',
      label: ' ⚙️  Model Routing Settings ',
      content: '',
      tags: true,
      border: { type: 'line', fg: 'magenta' },
      style: {
        fg: 'white',
        bg: 'black',
        border: { fg: 'magenta' },
        focus: { border: { fg: 'yellow' } }
      },
      keys: true,
      vi: true,
      mouse: true,
      scrollable: true,
      hidden: true
    });
    
    // Key handlers
    this.box.key(['escape'], () => this.close());
    this.box.key(['up', 'k'], () => this.navigateUp());
    this.box.key(['down', 'j'], () => this.navigateDown());
    this.box.key(['enter'], () => this.selectPreset());
    this.box.key(['1', '2', '3', '4'], (ch) => this.quickSelect(ch));
    
    this.screen.append(this.box);
  }
  
  show() {
    this.selectedPreset = this.presets.findIndex(p => p.key === this.modelRouter.currentPreset);
    this.render();
    this.box.show();
    this.box.focus();
    this.screen.render();
  }
  
  close() {
    this.box.hide();
    this.screen.focusNext();
    this.screen.render();
    if (this.onClose) this.onClose();
  }
  
  navigateUp() {
    this.selectedPreset = Math.max(0, this.selectedPreset - 1);
    this.render();
  }
  
  navigateDown() {
    this.selectedPreset = Math.min(this.presets.length - 1, this.selectedPreset + 1);
    this.render();
  }
  
  selectPreset() {
    const preset = this.presets[this.selectedPreset];
    this.modelRouter.setPreset(preset.key);
    this.render();
  }
  
  quickSelect(ch) {
    const index = parseInt(ch) - 1;
    if (index >= 0 && index < this.presets.length) {
      this.selectedPreset = index;
      this.selectPreset();
    }
  }
  
  render() {
    let content = '\n';
    
    // Presets section
    content += '{bold}{cyan-fg}Available Presets:{/cyan-fg}{/bold}\n\n';
    
    this.presets.forEach((preset, index) => {
      const isSelected = index === this.selectedPreset;
      const isCurrent = preset.key === this.modelRouter.currentPreset;
      const marker = isCurrent ? '●' : '○';
      const color = isSelected ? 'yellow' : (isCurrent ? 'green' : 'white');
      
      content += `  {${color}-fg}${marker} [${index + 1}] ${preset.name}{/${color}-fg}\n`;
      content += `     {gray-fg}${preset.description}{/gray-fg}\n\n`;
    });
    
    content += '\n{bold}─────────────────────────────────────────────────{/bold}\n\n';
    
    // Current configuration
    const currentPreset = this.modelRouter.getPresetInfo();
    content += '{bold}{cyan-fg}Current Configuration:{/cyan-fg}{/bold}\n\n';
    
    content += `  {bold}Orchestrator{/bold} (Decision Making):\n`;
    content += `  → {green-fg}${currentPreset.orchestrator || 'Not set'}{/green-fg}\n\n`;
    
    content += `  {bold}Executor{/bold} (Implementation):\n`;
    content += `  → {green-fg}${currentPreset.executor || 'Not set'}{/green-fg}\n\n`;
    
    content += `  {bold}Auditor{/bold} (Testing & Validation):\n`;
    content += `  → {green-fg}${currentPreset.auditor || 'Not set'}{/green-fg}\n\n`;
    
    content += '\n{bold}─────────────────────────────────────────────────{/bold}\n\n';
    
    // Available models
    content += '{bold}{cyan-fg}Available Models:{/cyan-fg}{/bold}\n\n';
    const models = this.modelRouter.availableModels;
    models.forEach(model => {
      const tierColor = {
        ultimate: 'magenta',
        premium: 'yellow',
        standard: 'green',
        efficient: 'cyan',
        fast: 'blue'
      }[model.tier] || 'white';
      
      content += `  • {${tierColor}-fg}${model.name}{/${tierColor}-fg} {gray-fg}(${model.tier}){/gray-fg}\n`;
    });
    
    content += '\n\n{center}{gray-fg}[↑↓] Navigate  [Enter] Select  [1-4] Quick Select  [ESC] Close{/gray-fg}{/center}';
    
    this.box.setContent(content);
    this.screen.render();
  }
}

// ============================================================================
// EXECUTION HISTORY COMPONENT
// ============================================================================

class ExecutionHistoryOverlay {
  constructor(screen, orchestrator, onClose) {
    this.screen = screen;
    this.orchestrator = orchestrator;
    this.onClose = onClose;
    this.selectedIndex = 0;
    
    this.createOverlay();
  }
  
  createOverlay() {
    this.box = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '90%',
      height: '85%',
      label: ' 📜 Execution History ',
      content: '',
      tags: true,
      border: { type: 'line', fg: 'cyan' },
      style: {
        fg: 'white',
        bg: 'black',
        border: { fg: 'cyan' }
      },
      keys: true,
      vi: true,
      mouse: true,
      scrollable: true,
      alwaysScroll: true,
      scrollbar: { ch: '█', style: { fg: 'cyan' } },
      hidden: true
    });
    
    this.box.key(['escape'], () => this.close());
    this.box.key(['up', 'k'], () => this.navigateUp());
    this.box.key(['down', 'j'], () => this.navigateDown());
    
    this.screen.append(this.box);
  }
  
  show() {
    this.render();
    this.box.show();
    this.box.focus();
    this.screen.render();
  }
  
  close() {
    this.box.hide();
    this.screen.focusNext();
    this.screen.render();
    if (this.onClose) this.onClose();
  }
  
  navigateUp() {
    this.box.scroll(-1);
    this.screen.render();
  }
  
  navigateDown() {
    this.box.scroll(1);
    this.screen.render();
  }
  
  render() {
    const history = this.orchestrator.getExecutionHistory(20);
    let content = '\n';
    
    if (history.length === 0) {
      content += '{center}{yellow-fg}No execution history yet{/yellow-fg}{/center}\n\n';
      content += '{center}{gray-fg}Hooks will appear here as they are executed{/gray-fg}{/center}';
    } else {
      // Workflow flow visualization
      content += '{bold}{cyan-fg}Workflow Flow:{/cyan-fg}{/bold}\n\n';
      
      history.forEach((item, index) => {
        const isLast = index === history.length - 1;
        const status = item.result?.status === 'completed' ? '✅' : 
                      item.result?.status === 'failed' ? '❌' : '⚙️';
        
        // Hook box
        content += '  ┌─────────────────────┐\n';
        content += `  │ ${item.hook.padEnd(19)} │ ${status}\n`;
        content += '  └─────────────────────┘\n';
        
        if (!isLast) {
          content += '         │\n';
          content += '         ▼\n';
        }
      });
      
      content += '\n\n{bold}─────────────────────────────────────────────────{/bold}\n\n';
      
      // Detailed history
      content += '{bold}{cyan-fg}Recent Executions:{/cyan-fg}{/bold}\n\n';
      
      history.slice().reverse().forEach((item, index) => {
        const num = history.length - index;
        const status = item.result?.status === 'completed' ? '{green-fg}✅ Completed{/green-fg}' :
                      item.result?.status === 'failed' ? '{red-fg}❌ Failed{/red-fg}' :
                      '{yellow-fg}⚙️  Running{/yellow-fg}';
        
        content += `{bold}${num}. ${item.hook}{/bold}\n`;
        content += `   Status: ${status}\n`;
        
        if (item.result?.model) {
          content += `   Model: {cyan-fg}${item.result.model}{/cyan-fg}\n`;
        }
        
        if (item.timestamp) {
          const date = new Date(item.timestamp);
          content += `   Time: {gray-fg}${date.toLocaleString()}{/gray-fg}\n`;
        }
        
        if (item.result?.confidence) {
          const confColor = item.result.confidence === 'high' ? 'green' :
                           item.result.confidence === 'medium' ? 'yellow' : 'red';
          content += `   Confidence: {${confColor}-fg}${item.result.confidence}{/${confColor}-fg}\n`;
        }
        
        if (item.result?.filesCreated?.length > 0) {
          content += `   Files Created: {green-fg}${item.result.filesCreated.length}{/green-fg}\n`;
        }
        
        if (item.result?.filesModified?.length > 0) {
          content += `   Files Modified: {yellow-fg}${item.result.filesModified.length}{/yellow-fg}\n`;
        }
        
        if (item.result?.summary) {
          content += `   Summary: {gray-fg}${item.result.summary}{/gray-fg}\n`;
        }
        
        content += '\n';
      });
    }
    
    content += '\n{center}{gray-fg}[↑↓] Scroll  [ESC] Close{/gray-fg}{/center}';
    
    this.box.setContent(content);
    this.screen.render();
  }
}

// ============================================================================
// USER QUESTIONS COMPONENT
// ============================================================================

class UserQuestionsOverlay {
  constructor(screen, orchestrator, onAnswer) {
    this.screen = screen;
    this.orchestrator = orchestrator;
    this.onAnswer = onAnswer;
    this.currentQuestion = 0;
    this.inputValue = '';
    
    this.createOverlay();
  }
  
  createOverlay() {
    this.box = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '80%',
      height: '60%',
      label: ' ❓ User Input Required ',
      content: '',
      tags: true,
      border: { type: 'line', fg: 'yellow' },
      style: {
        fg: 'white',
        bg: 'black',
        border: { fg: 'yellow' }
      },
      keys: true,
      vi: true,
      mouse: true,
      hidden: true
    });
    
    this.input = blessed.textbox({
      parent: this.box,
      bottom: 3,
      left: 2,
      right: 2,
      height: 3,
      border: { type: 'line', fg: 'cyan' },
      style: {
        fg: 'white',
        bg: 'black',
        border: { fg: 'cyan' },
        focus: { border: { fg: 'yellow' } }
      },
      inputOnFocus: true
    });
    
    this.box.key(['escape'], () => this.close());
    this.box.key(['tab'], () => this.nextQuestion());
    
    this.input.on('submit', (value) => {
      this.submitAnswer(value);
    });
    
    this.screen.append(this.box);
  }
  
  show(questions) {
    this.questions = questions || this.orchestrator.userQuestions || [];
    this.currentQuestion = 0;
    this.inputValue = '';
    
    if (this.questions.length === 0) {
      return;
    }
    
    this.render();
    this.box.show();
    this.input.focus();
    this.screen.render();
  }
  
  close() {
    this.box.hide();
    this.screen.focusNext();
    this.screen.render();
  }
  
  nextQuestion() {
    if (this.currentQuestion < this.questions.length - 1) {
      this.currentQuestion++;
      this.inputValue = '';
      this.render();
    }
  }
  
  submitAnswer(value) {
    if (!value || value.trim() === '') {
      return;
    }
    
    const question = this.questions[this.currentQuestion];
    
    if (this.onAnswer) {
      this.onAnswer(this.currentQuestion, value);
    }
    
    // Move to next question or close
    if (this.currentQuestion < this.questions.length - 1) {
      this.nextQuestion();
    } else {
      this.close();
    }
  }
  
  render() {
    if (!this.questions || this.questions.length === 0) {
      return;
    }
    
    const question = this.questions[this.currentQuestion];
    let content = '\n';
    
    content += `{bold}Hook:{/bold} {cyan-fg}${question.hook}{/cyan-fg}\n`;
    content += `{bold}Reason:{/bold} {yellow-fg}${question.reason}{/yellow-fg}\n\n`;
    
    content += '{bold}─────────────────────────────────────────────────{/bold}\n\n';
    
    content += `{bold}Question ${this.currentQuestion + 1} of ${this.questions.length}:{/bold}\n\n`;
    
    if (question.questions && question.questions.length > 0) {
      question.questions.forEach((q, index) => {
        content += `  ${index + 1}. ${q}\n`;
      });
    }
    
    content += '\n{bold}─────────────────────────────────────────────────{/bold}\n\n';
    
    content += '{gray-fg}Type your answer below and press Enter to submit{/gray-fg}\n';
    content += '{gray-fg}Press Tab for next question, ESC to skip{/gray-fg}\n';
    
    this.box.setContent(content);
    this.input.clearValue();
    this.screen.render();
  }
}

// ============================================================================
// STREAMING DISPLAY COMPONENT
// ============================================================================

class StreamingDisplay {
  constructor(box) {
    this.box = box;
    this.thinkingBuffer = [];
    this.executionBuffer = [];
    this.maxLines = 20;
  }
  
  addThinking(text) {
    this.thinkingBuffer.push({
      type: 'thinking',
      text,
      timestamp: new Date()
    });
    
    if (this.thinkingBuffer.length > this.maxLines) {
      this.thinkingBuffer.shift();
    }
    
    this.render();
  }
  
  addExecution(text) {
    this.executionBuffer.push({
      type: 'execution',
      text,
      timestamp: new Date()
    });
    
    if (this.executionBuffer.length > this.maxLines) {
      this.executionBuffer.shift();
    }
    
    this.render();
  }
  
  clear() {
    this.thinkingBuffer = [];
    this.executionBuffer = [];
    this.render();
  }
  
  render() {
    let content = '';
    
    if (this.thinkingBuffer.length > 0) {
      content += '{bold}{cyan-fg}🧠 Thinking:{/cyan-fg}{/bold}\n';
      this.thinkingBuffer.forEach(item => {
        content += `  {gray-fg}${item.text}{/gray-fg}\n`;
      });
      content += '\n';
    }
    
    if (this.executionBuffer.length > 0) {
      content += '{bold}{green-fg}⚙️  Executing:{/green-fg}{/bold}\n';
      this.executionBuffer.forEach(item => {
        content += `  {white-fg}${item.text}{/white-fg}\n`;
      });
    }
    
    if (this.thinkingBuffer.length === 0 && this.executionBuffer.length === 0) {
      content = '{center}{gray-fg}No active execution{/gray-fg}{/center}';
    }
    
    this.box.setContent(content);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  ModelSettingsOverlay,
  ExecutionHistoryOverlay,
  UserQuestionsOverlay,
  StreamingDisplay
};
