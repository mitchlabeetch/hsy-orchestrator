#!/usr/bin/env node

/**
 * Kiro Integration Module
 * 
 * Provides access to Kiro's native tools when running inside Kiro context
 * Falls back to CLI/simulation when running standalone
 */

/**
 * Check if we're running inside Kiro
 */
function isKiroContext() {
  // Check for Kiro-specific environment variables or globals
  return process.env.KIRO_CONTEXT === 'true' || 
         typeof global.kiroTools !== 'undefined';
}

/**
 * Initialize Kiro tools bridge
 * This should be called by Kiro when it executes the orchestrator
 */
function initializeKiroTools(tools) {
  if (!global.kiroTools) {
    global.kiroTools = tools;
  }
}

/**
 * Invoke a Kiro sub-agent
 * 
 * @param {Object} options - Agent invocation options
 * @param {string} options.name - Agent name (e.g., 'general-task-execution')
 * @param {string} options.prompt - Task prompt for the agent
 * @param {string} options.explanation - Explanation of why agent is being invoked
 * @param {string} options.model - Optional model preference
 * @returns {Promise<Object>} Agent execution result
 */
async function invokeSubAgent(options) {
  if (!isKiroContext()) {
    throw new Error('Not running in Kiro context. Cannot invoke sub-agent.');
  }
  
  if (!global.kiroTools || !global.kiroTools.invokeSubAgent) {
    throw new Error('Kiro tools not initialized. Cannot invoke sub-agent.');
  }
  
  return await global.kiroTools.invokeSubAgent(options);
}

/**
 * Read a file using Kiro's tools
 */
async function readFile(path, explanation) {
  if (!isKiroContext()) {
    const fs = require('fs');
    return fs.readFileSync(path, 'utf8');
  }
  
  if (!global.kiroTools || !global.kiroTools.readFile) {
    throw new Error('Kiro tools not initialized. Cannot read file.');
  }
  
  return await global.kiroTools.readFile({ path, explanation });
}

/**
 * Write a file using Kiro's tools
 */
async function writeFile(path, text) {
  if (!isKiroContext()) {
    const fs = require('fs');
    return fs.writeFileSync(path, text, 'utf8');
  }
  
  if (!global.kiroTools || !global.kiroTools.fsWrite) {
    throw new Error('Kiro tools not initialized. Cannot write file.');
  }
  
  return await global.kiroTools.fsWrite({ path, text });
}

/**
 * Execute a bash command using Kiro's tools
 */
async function executeBash(command, cwd) {
  if (!isKiroContext()) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    return await execAsync(command, { cwd });
  }
  
  if (!global.kiroTools || !global.kiroTools.executeBash) {
    throw new Error('Kiro tools not initialized. Cannot execute bash.');
  }
  
  return await global.kiroTools.executeBash({ command, cwd });
}

/**
 * Get diagnostics for a file
 */
async function getDiagnostics(paths) {
  if (!isKiroContext()) {
    return []; // No diagnostics in standalone mode
  }
  
  if (!global.kiroTools || !global.kiroTools.getDiagnostics) {
    return [];
  }
  
  return await global.kiroTools.getDiagnostics({ paths });
}

/**
 * Stream handler for real-time updates
 */
class StreamHandler {
  constructor() {
    this.listeners = {
      thinking: [],
      execution: [],
      result: [],
      error: []
    };
  }
  
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }
  
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
  
  removeListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }
}

/**
 * Create a streaming sub-agent invocation
 * This allows real-time updates from the agent
 */
async function invokeSubAgentStreaming(options, streamHandler) {
  if (!isKiroContext()) {
    throw new Error('Streaming not available outside Kiro context');
  }
  
  // For now, use regular invocation and simulate streaming
  // In future, Kiro may support native streaming
  streamHandler.emit('thinking', 'Starting agent execution...');
  
  try {
    const result = await invokeSubAgent(options);
    
    streamHandler.emit('execution', 'Agent completed successfully');
    streamHandler.emit('result', result);
    
    return result;
  } catch (error) {
    streamHandler.emit('error', error);
    throw error;
  }
}

/**
 * Get available models from Kiro
 */
async function getAvailableModels() {
  if (!isKiroContext()) {
    // Return default models for standalone mode
    return [
      { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5', tier: 'premium' },
      { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', tier: 'standard' },
      { id: 'claude-sonnet-3.5', name: 'Claude Sonnet 3.5', tier: 'efficient' },
      { id: 'claude-haiku-3.5', name: 'Claude Haiku 3.5', tier: 'fast' }
    ];
  }
  
  if (!global.kiroTools || !global.kiroTools.getAvailableModels) {
    // Return defaults if not available
    return [
      { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5', tier: 'premium' },
      { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', tier: 'standard' }
    ];
  }
  
  return await global.kiroTools.getAvailableModels();
}

module.exports = {
  isKiroContext,
  initializeKiroTools,
  invokeSubAgent,
  invokeSubAgentStreaming,
  readFile,
  writeFile,
  executeBash,
  getDiagnostics,
  getAvailableModels,
  StreamHandler
};
