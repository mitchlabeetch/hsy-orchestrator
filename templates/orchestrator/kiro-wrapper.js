#!/usr/bin/env node

/**
 * Kiro Wrapper for HSY Orchestrator
 * 
 * This script is designed to be invoked by Kiro's agent system.
 * It initializes the Kiro tools bridge and starts the orchestrator.
 * 
 * Usage from Kiro:
 *   invokeSubAgent({
 *     name: 'general-task-execution',
 *     prompt: 'Run the HSY orchestrator',
 *     explanation: 'Starting autonomous orchestration'
 *   })
 */

const path = require('path');
const kiroIntegration = require('./src/kiro-integration.js');

/**
 * Initialize Kiro tools if available
 * This function should be called by Kiro when it provides tool access
 */
function initializeKiroTools(tools) {
  console.log('Initializing Kiro tools bridge...');
  kiroIntegration.initializeKiroTools(tools);
  console.log('Kiro tools initialized successfully');
}

/**
 * Main entry point
 */
async function main() {
  console.log('HSY Orchestrator - Kiro Wrapper');
  console.log('================================\n');
  
  // Check if running in Kiro context
  if (kiroIntegration.isKiroContext()) {
    console.log('✅ Running in Kiro context');
  } else {
    console.log('⚠️  Not running in Kiro context - using fallback mode');
  }
  
  // Import and start the orchestrator
  const { KiroOrchestrator } = require('./src/kiro-orchestrator.js');
  const { ModelRouter, AIOrchestrator } = require('./src/ai-orchestrator.js');
  
  const workspaceRoot = process.cwd();
  
  console.log(`Workspace: ${workspaceRoot}\n`);
  
  // Initialize orchestrators
  const baseOrchestrator = new KiroOrchestrator(workspaceRoot);
  const modelRouter = new ModelRouter();
  const aiOrchestrator = new AIOrchestrator(
    baseOrchestrator,
    modelRouter,
    baseOrchestrator.logger
  );
  
  // Set up event handlers for logging
  aiOrchestrator.on('started', (data) => {
    console.log(`\n🚀 AI Orchestrator started`);
    console.log(`   Scenario: ${data.scenario.type}`);
    console.log(`   Description: ${data.scenario.description}`);
    console.log(`   Suggested hook: ${data.scenario.suggestedHook}\n`);
  });
  
  aiOrchestrator.on('hookStarting', (data) => {
    console.log(`\n⚙️  Executing: ${data.hook}`);
  });
  
  aiOrchestrator.on('hookCompleted', (data) => {
    console.log(`✅ Completed: ${data.hook}`);
    if (data.result.summary) {
      console.log(`   ${data.result.summary}`);
    }
  });
  
  aiOrchestrator.on('questionRequired', (data) => {
    console.log(`\n❓ User input required for: ${data.hook}`);
    console.log(`   Reason: ${data.reason}`);
  });
  
  aiOrchestrator.on('workflowComplete', () => {
    console.log('\n🎉 Workflow complete! All hooks executed.');
  });
  
  aiOrchestrator.on('error', (error) => {
    console.error(`\n❌ Error: ${error.message}`);
  });
  
  // Start the orchestrator
  try {
    await aiOrchestrator.start();
    
    // Keep running until workflow is complete or error occurs
    await new Promise((resolve) => {
      aiOrchestrator.on('workflowComplete', resolve);
      aiOrchestrator.on('error', resolve);
      
      // Also resolve if orchestrator stops
      const checkInterval = setInterval(() => {
        if (!aiOrchestrator.isRunning) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
    
    console.log('\n✅ Orchestrator finished');
    
  } catch (error) {
    console.error('\n❌ Orchestrator failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Export for use by Kiro
module.exports = {
  initializeKiroTools,
  main
};

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
