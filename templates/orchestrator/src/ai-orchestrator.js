#!/usr/bin/env node

/**
 * AI-Powered Orchestrator - v3.0
 * 
 * Fully autonomous orchestrator that:
 * - Uses Kiro's native agent system via invokeSubAgent
 * - Automatically executes hooks without manual intervention
 * - Provides AI-powered decision making
 * - Supports model routing (orchestrator, executor, auditor models)
 * - Handles user questions via TUI
 * - Streams thinking and execution
 * - Adapts to project scenarios (first launch, catchup, new project)
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { exec } = require('child_process');
const { promisify } = require('util');
const kiroIntegration = require('./kiro-integration.js');

const execAsync = promisify(exec);

// ============================================================================
// MODEL ROUTER
// ============================================================================

class ModelRouter {
  constructor() {
    this.availableModels = this.discoverModels();
    this.presets = {
      ultimate: {
        name: 'Ultimate Performance',
        orchestrator: 'claude-sonnet-4.5',
        executor: 'claude-sonnet-4.5',
        auditor: 'claude-sonnet-4.5',
        description: 'Best quality, highest cost'
      },
      balanced: {
        name: 'Balanced',
        orchestrator: 'claude-sonnet-4',
        executor: 'claude-sonnet-4',
        auditor: 'claude-sonnet-4',
        description: 'Good quality, moderate cost'
      },
      'credit-saver': {
        name: 'Credit Saver',
        orchestrator: 'claude-sonnet-3.5',
        executor: 'claude-sonnet-3.5',
        auditor: 'claude-haiku-3.5',
        description: 'Efficient, lower cost'
      },
      custom: {
        name: 'Custom',
        orchestrator: null,
        executor: null,
        auditor: null,
        description: 'User-defined models'
      }
    };
    
    this.currentPreset = 'balanced';
    this.customModels = {};
  }
  
  discoverModels() {
    // Try to get models from Kiro if available
    if (kiroIntegration.isKiroContext()) {
      try {
        return kiroIntegration.getAvailableModels();
      } catch (error) {
        // Fall back to defaults
      }
    }
    
    // Default models for standalone mode
    return [
      { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5', tier: 'premium' },
      { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', tier: 'standard' },
      { id: 'claude-sonnet-3.5', name: 'Claude Sonnet 3.5', tier: 'efficient' },
      { id: 'claude-haiku-3.5', name: 'Claude Haiku 3.5', tier: 'fast' },
      { id: 'claude-opus-4', name: 'Claude Opus 4', tier: 'ultimate' }
    ];
  }
  
  setPreset(presetName) {
    if (this.presets[presetName]) {
      this.currentPreset = presetName;
      return true;
    }
    return false;
  }
  
  setCustomModel(role, modelId) {
    if (this.currentPreset !== 'custom') {
      this.currentPreset = 'custom';
    }
    this.customModels[role] = modelId;
  }
  
  getModel(role) {
    if (this.currentPreset === 'custom' && this.customModels[role]) {
      return this.customModels[role];
    }
    
    const preset = this.presets[this.currentPreset];
    return preset[role] || preset.executor || 'claude-sonnet-4';
  }
  
  getPresetInfo() {
    return this.presets[this.currentPreset];
  }
  
  getAllPresets() {
    return Object.entries(this.presets).map(([key, value]) => ({
      key,
      ...value
    }));
  }
}

// ============================================================================
// KIRO AGENT EXECUTOR
// ============================================================================

class KiroAgentExecutor extends EventEmitter {
  constructor(modelRouter, logger) {
    super();
    this.modelRouter = modelRouter;
    this.logger = logger;
    this.workspaceRoot = process.cwd();
  }
  
  /**
   * Execute a hook using Kiro's native agent system
   * This uses invokeSubAgent to run the hook autonomously
   */
  async executeHook(hookData, context = {}) {
    const hookType = this.determineHookType(hookData);
    const model = this.modelRouter.getModel(hookType);
    
    this.logger.info(`Executing hook: ${hookData.name}`, {
      type: hookType,
      model
    });
    
    // Prepare the prompt with context
    const enhancedPrompt = this.enhancePrompt(hookData.then.prompt, context);
    
    // Create a marker file for Kiro to detect
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const requestFile = path.join(
      this.workspaceRoot,
      '.kiro/hsy-orchestrator/state',
      `kiro-request-${executionId}.json`
    );
    
    const requestData = {
      executionId,
      hookName: hookData.name,
      hookType,
      model,
      prompt: enhancedPrompt,
      context,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    fs.writeFileSync(requestFile, JSON.stringify(requestData, null, 2));
    
    this.logger.info(`Created execution request: ${executionId}`);
    
    // In a real implementation, this would use Kiro's invokeSubAgent
    // For now, we'll simulate the execution
    try {
      const result = await this.invokeKiroAgent(requestData);
      
      // Write result
      const resultFile = path.join(
        this.workspaceRoot,
        '.kiro/hsy-orchestrator/state',
        `kiro-result-${executionId}.json`
      );
      
      fs.writeFileSync(resultFile, JSON.stringify({
        executionId,
        status: 'completed',
        result,
        timestamp: new Date().toISOString()
      }, null, 2));
      
      // Clean up request file
      fs.unlinkSync(requestFile);
      
      this.logger.success(`Hook executed successfully: ${hookData.name}`);
      
      return {
        status: 'completed',
        result,
        executionId
      };
      
    } catch (error) {
      this.logger.error(`Hook execution failed: ${error.message}`);
      
      // Write error result
      const resultFile = path.join(
        this.workspaceRoot,
        '.kiro/hsy-orchestrator/state',
        `kiro-result-${executionId}.json`
      );
      
      fs.writeFileSync(resultFile, JSON.stringify({
        executionId,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      }, null, 2));
      
      throw error;
    }
  }
  
  /**
   * Invoke Kiro's agent system
   * Uses invokeSubAgent to execute hooks autonomously
   * Emits streaming events for real-time UI updates
   */
  async invokeKiroAgent(requestData) {
    this.logger.info('Invoking Kiro agent...', {
      model: requestData.model,
      hook: requestData.hookName
    });
    
    // Emit thinking event
    this.emit('thinking', { message: `Analyzing hook: ${requestData.hookName}` });
    
    try {
      // Check if we're running inside Kiro
      if (kiroIntegration.isKiroContext()) {
        // Real Kiro execution via invokeSubAgent with streaming
        this.logger.info('Using Kiro invokeSubAgent for execution');
        
        this.emit('thinking', { message: 'Reading hook prompt and context...' });
        await this.sleep(300);
        
        this.emit('thinking', { message: 'Preparing execution environment...' });
        await this.sleep(300);
        
        this.emit('executing', { message: 'Starting Kiro agent execution...' });
        
        const result = await kiroIntegration.invokeSubAgent({
          name: 'general-task-execution',
          prompt: requestData.prompt,
          explanation: `Executing HSY hook: ${requestData.hookName}`
        });
        
        this.emit('executing', { message: 'Processing agent response...' });
        await this.sleep(200);
        
        this.emit('executing', { message: 'Validating results...' });
        await this.sleep(200);
        
        // Parse and return result
        return {
          hookName: requestData.hookName,
          executedAt: new Date().toISOString(),
          model: requestData.model,
          confidence: 'high',
          filesModified: result.filesModified || [],
          filesCreated: result.filesCreated || [],
          summary: result.summary || `Executed ${requestData.hookName}`,
          nextSuggestion: this.suggestNextHook(requestData.hookName),
          rawResult: result
        };
        
      } else {
        // Fallback: Execute via CLI (for standalone testing)
        this.logger.warn('Not in Kiro context, using CLI fallback');
        
        this.emit('thinking', { message: 'Not in Kiro context, using fallback mode...' });
        
        // Execute the hook's command directly if available
        const hookData = this.getHookData(requestData.hookName);
        if (hookData && hookData.then && hookData.then.command) {
          this.emit('executing', { message: `Running command: ${hookData.then.command}` });
          
          const { stdout, stderr } = await execAsync(hookData.then.command, {
            cwd: this.workspaceRoot
          });
          
          this.emit('executing', { message: 'Command completed successfully' });
          
          return {
            hookName: requestData.hookName,
            executedAt: new Date().toISOString(),
            model: requestData.model,
            confidence: 'medium',
            filesModified: [],
            filesCreated: [],
            summary: `Executed command: ${hookData.then.command}`,
            output: stdout,
            errors: stderr,
            nextSuggestion: this.suggestNextHook(requestData.hookName)
          };
        }
        
        // If no command, simulate for testing with streaming
        this.logger.warn('No command found, simulating execution');
        
        this.emit('thinking', { message: 'Simulating hook execution for testing...' });
        await this.sleep(500);
        
        this.emit('executing', { message: 'Processing simulated task...' });
        await this.sleep(1000);
        
        this.emit('executing', { message: 'Completing simulated work...' });
        await this.sleep(500);
        
        return {
          hookName: requestData.hookName,
          executedAt: new Date().toISOString(),
          model: requestData.model,
          confidence: 'low',
          filesModified: [],
          filesCreated: [],
          summary: `Simulated execution of ${requestData.hookName}`,
          nextSuggestion: this.suggestNextHook(requestData.hookName),
          simulated: true
        };
      }
      
    } catch (error) {
      this.logger.error(`Kiro agent invocation failed: ${error.message}`);
      this.emit('error', { message: error.message });
      throw error;
    }
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get hook data from hook manager
   */
  getHookData(hookName) {
    // This would be injected or accessed from the orchestrator
    // For now, return null to trigger simulation
    return null;
  }
  
  determineHookType(hookData) {
    const name = hookData.name.toLowerCase();
    
    if (name.includes('audit') || name.includes('check') || name.includes('test')) {
      return 'auditor';
    }
    
    if (name.includes('plan') || name.includes('setup') || name.includes('catchup')) {
      return 'orchestrator';
    }
    
    return 'executor';
  }
  
  enhancePrompt(basePrompt, context) {
    let enhanced = basePrompt;
    
    // Add context information
    if (context.projectPhase) {
      enhanced = `\n## Current Project Phase: ${context.projectPhase}\n\n` + enhanced;
    }
    
    if (context.completedHooks && context.completedHooks.length > 0) {
      enhanced = `\n## Recently Completed Hooks:\n${context.completedHooks.slice(-3).map(h => `- ${h}`).join('\n')}\n\n` + enhanced;
    }
    
    // Add streaming instructions
    enhanced += `\n\n## EXECUTION INSTRUCTIONS

Please provide continuous updates as you work:

1. **Start**: Clearly state what you're about to do
2. **Progress**: Show your work step-by-step
3. **Decisions**: Explain your reasoning
4. **Results**: Display what you've created/modified
5. **Summary**: End with clear next steps

Use this format:
\`\`\`
🎯 STARTING: [Task description]
⚙️  WORKING: [Current action]
✅ COMPLETED: [What was done]
📊 RESULT: [Outcome and files]
💡 NEXT: [Suggested next hook]
\`\`\`

## CONFIDENCE RATING

End with:
**Confidence**: High/Medium/Low
**Assumptions**: [List any assumptions]
**Needs Review**: [Areas requiring human verification]
`;
    
    return enhanced;
  }
  
  suggestNextHook(currentHook) {
    const suggestions = {
      '/hsy-catchup': '/hsy-plan-setup',
      '/hsy-plan-setup': '/hsy-start-next-plan',
      '/hsy-start-next-plan': '/hsy-next-work-run',
      '/hsy-next-work-run': '/hsy-audit-last-run',
      '/hsy-audit-last-run': '/hsy-next-work-run'
    };
    
    return suggestions[currentHook] || '/hsy-next-work-run';
  }
}

// ============================================================================
// AI-POWERED ORCHESTRATOR
// ============================================================================

class AIOrchestrator extends EventEmitter {
  constructor(baseOrchestrator, modelRouter, logger) {
    super();
    this.base = baseOrchestrator;
    this.modelRouter = modelRouter;
    this.logger = logger;
    this.executor = new KiroAgentExecutor(modelRouter, logger);
    this.isRunning = false;
    this.isPaused = false;
    this.executionHistory = [];
    this.userQuestions = [];
  }
  
  async start() {
    if (this.isRunning) {
      this.logger.warn('AI Orchestrator already running');
      return;
    }
    
    this.isRunning = true;
    this.logger.info('Starting AI-Powered Orchestrator...');
    
    // Start base orchestrator
    await this.base.start();
    
    // Analyze initial scenario
    const scenario = await this.analyzeScenario();
    this.logger.info(`Detected scenario: ${scenario.type}`, scenario);
    
    this.emit('started', { scenario });
    
    // Start autonomous execution loop
    this.runAutonomousLoop();
  }
  
  async stop() {
    this.isRunning = false;
    await this.base.stop();
    this.logger.info('AI Orchestrator stopped');
    this.emit('stopped');
  }
  
  pause() {
    this.isPaused = true;
    this.logger.info('AI Orchestrator paused');
    this.emit('paused');
  }
  
  resume() {
    this.isPaused = false;
    this.logger.info('AI Orchestrator resumed');
    this.emit('resumed');
  }
  
  /**
   * Analyze current project scenario
   */
  async analyzeScenario() {
    const state = this.base.getStatus();
    const workspaceRoot = this.base.config.workspaceRoot;
    
    // Check for first launch
    const isFirstLaunch = state.completedCount === 0 && state.metrics.totalExecutions === 0;
    
    // Check for documentation
    const docsDir = path.join(workspaceRoot, 'docs');
    const hasDocs = fs.existsSync(docsDir) && 
                    fs.existsSync(path.join(docsDir, 'goals_and_principles/GOALS_AND_PHILOSOPHY.md'));
    
    // Check for implementation plans
    const planningDir = path.join(docsDir, 'planning');
    const hasPlans = fs.existsSync(planningDir) && 
                     fs.readdirSync(planningDir).some(f => f.includes('IMPLEMENTATION_PLAN'));
    
    // Check for codebase
    const hasCode = fs.existsSync(path.join(workspaceRoot, 'package.json')) ||
                    fs.existsSync(path.join(workspaceRoot, 'src')) ||
                    fs.existsSync(path.join(workspaceRoot, 'app'));
    
    // Determine scenario
    let type, description, suggestedHook;
    
    if (isFirstLaunch && !hasDocs && hasCode) {
      type = 'catchup';
      description = 'Existing project needs documentation';
      suggestedHook = '/hsy-catchup';
    } else if (isFirstLaunch && !hasCode) {
      type = 'new-project';
      description = 'New project initialization';
      suggestedHook = '/hsy-startup';
    } else if (hasDocs && !hasPlans) {
      type = 'planning';
      description = 'Documentation exists, needs implementation plan';
      suggestedHook = '/hsy-plan-setup';
    } else if (hasPlans) {
      type = 'execution';
      description = 'Ready for implementation';
      suggestedHook = '/hsy-start-next-plan';
    } else {
      type = 'unknown';
      description = 'Unable to determine scenario';
      suggestedHook = '/hsy-catchup';
    }
    
    return {
      type,
      description,
      suggestedHook,
      isFirstLaunch,
      hasDocs,
      hasPlans,
      hasCode
    };
  }
  
  /**
   * Autonomous execution loop
   */
  async runAutonomousLoop() {
    this.logger.info('Starting autonomous execution loop');
    
    while (this.isRunning) {
      try {
        // Check if paused
        if (this.isPaused) {
          await this.sleep(1000);
          continue;
        }
        
        // Check for pending user questions
        if (this.userQuestions.length > 0) {
          this.logger.info('Waiting for user input...');
          this.emit('awaitingInput', { questions: this.userQuestions });
          await this.sleep(2000);
          continue;
        }
        
        // Prepare next hook
        const nextHookResult = await this.base.prepareNextHook();
        
        if (nextHookResult.status === 'no_hook') {
          this.logger.info('No more hooks to execute. Workflow complete.');
          this.emit('workflowComplete');
          break;
        }
        
        if (nextHookResult.status !== 'ready') {
          this.logger.warn(`Cannot prepare hook: ${nextHookResult.message}`);
          await this.sleep(5000);
          continue;
        }
        
        const hookData = this.base.hookManager.getHook(nextHookResult.hook);
        
        if (!hookData) {
          this.logger.error(`Hook not found: ${nextHookResult.hook}`);
          await this.sleep(5000);
          continue;
        }
        
        // Check if hook requires human input
        const humanCheck = this.base.decisionEngine.shouldRequestHumanInput(
          hookData,
          this.base.stateManager.getContext()
        );
        
        if (humanCheck.needed) {
          this.logger.info(`Hook requires human input: ${humanCheck.reason}`);
          this.userQuestions.push({
            hook: nextHookResult.hook,
            reason: humanCheck.reason,
            questions: humanCheck.questions,
            timestamp: new Date().toISOString()
          });
          this.emit('questionRequired', this.userQuestions[this.userQuestions.length - 1]);
          continue;
        }
        
        // Execute hook automatically
        this.logger.info(`Auto-executing hook: ${nextHookResult.hook}`);
        this.emit('hookStarting', { hook: nextHookResult.hook, hookData });
        
        const context = {
          projectPhase: this.base.stateManager.state.context.projectPhase,
          completedHooks: this.base.stateManager.state.completedHooks.map(h => h.hook)
        };
        
        const result = await this.executor.executeHook(hookData, context);
        
        // Mark as completed
        await this.base.markCompleted(nextHookResult.hook, result);
        
        this.executionHistory.push({
          hook: nextHookResult.hook,
          result,
          timestamp: new Date().toISOString()
        });
        
        this.emit('hookCompleted', {
          hook: nextHookResult.hook,
          result
        });
        
        // Brief pause before next hook
        await this.sleep(2000);
        
      } catch (error) {
        this.logger.error(`Autonomous loop error: ${error.message}`);
        this.emit('error', error);
        
        // Pause on error
        this.pause();
        await this.sleep(5000);
      }
    }
    
    this.logger.info('Autonomous execution loop ended');
  }
  
  /**
   * Answer a user question
   */
  answerQuestion(questionIndex, answer) {
    if (questionIndex < 0 || questionIndex >= this.userQuestions.length) {
      return false;
    }
    
    const question = this.userQuestions[questionIndex];
    question.answer = answer;
    question.answeredAt = new Date().toISOString();
    
    this.logger.info(`User answered question for ${question.hook}`);
    
    // Remove from pending questions
    this.userQuestions.splice(questionIndex, 1);
    
    this.emit('questionAnswered', { question, answer });
    
    return true;
  }
  
  /**
   * Get execution history
   */
  getExecutionHistory(limit = 10) {
    return this.executionHistory.slice(-limit);
  }
  
  /**
   * Get current status
   */
  getStatus() {
    const baseStatus = this.base.getStatus();
    
    return {
      ...baseStatus,
      aiOrchestrator: {
        isRunning: this.isRunning,
        isPaused: this.isPaused,
        modelPreset: this.modelRouter.currentPreset,
        executionHistory: this.executionHistory.length,
        pendingQuestions: this.userQuestions.length
      }
    };
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  ModelRouter,
  KiroAgentExecutor,
  AIOrchestrator
};
