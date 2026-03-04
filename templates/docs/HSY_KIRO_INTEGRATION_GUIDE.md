# HSY Kiro Integration Guide

## Overview

This guide explains how to use the HSY Autonomous Orchestrator from within Kiro's agent system.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Kiro Agent                           │
│  (You are here - reading this guide)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ invokeSubAgent()
                     ▼
┌─────────────────────────────────────────────────────────┐
│              HSY Orchestrator Wrapper                   │
│  (.kiro/hsy-orchestrator/kiro-wrapper.js)              │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Initializes
                     ▼
┌─────────────────────────────────────────────────────────┐
│              AI Orchestrator                            │
│  (Autonomous execution loop)                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ For each hook
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Kiro Agent Executor                        │
│  (Invokes sub-agents for each hook)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ invokeSubAgent()
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Hook Execution                             │
│  (Actual work: create files, modify code, etc.)        │
└─────────────────────────────────────────────────────────┘
```

## Usage from Kiro

### Method 1: Direct Invocation (Recommended)

When you (Kiro agent) want to start the HSY orchestrator:

```javascript
// Invoke the orchestrator as a sub-agent
const result = await invokeSubAgent({
  name: 'general-task-execution',
  prompt: `
    Start the HSY autonomous orchestrator.
    
    The orchestrator will:
    1. Analyze the current project state
    2. Detect the appropriate scenario (first launch, catchup, planning, execution)
    3. Execute hooks autonomously
    4. Continue until workflow is complete
    
    Please run: node .kiro/hsy-orchestrator/kiro-wrapper.js
  `,
  explanation: 'Starting HSY autonomous orchestration system'
});
```

### Method 2: Via TUI (For User Interaction)

If the user wants to interact with the system:

```javascript
// Launch the TUI
const result = await invokeSubAgent({
  name: 'general-task-execution',
  prompt: `
    Launch the HSY TUI (Terminal User Interface).
    
    Run: node .kiro/hsy-launch
    
    This will:
    1. Run self-tests
    2. Launch the TUI v3.0
    3. Allow user to control the orchestrator
    4. Show real-time progress
  `,
  explanation: 'Launching HSY TUI for user interaction'
});
```

### Method 3: CLI Mode (Headless)

For automated/headless execution:

```javascript
// Run in CLI mode
const result = await invokeSubAgent({
  name: 'general-task-execution',
  prompt: `
    Run HSY in CLI mode (no TUI).
    
    Run: node .kiro/hsy-auto
    
    This will execute hooks automatically without user interface.
  `,
  explanation: 'Running HSY in headless CLI mode'
});
```

## How It Works

### 1. Initialization

When the orchestrator starts:

```javascript
// The wrapper initializes Kiro tools
kiroIntegration.initializeKiroTools(tools);

// Then starts the AI orchestrator
const aiOrchestrator = new AIOrchestrator(
  baseOrchestrator,
  modelRouter,
  logger
);

await aiOrchestrator.start();
```

### 2. Scenario Detection

The orchestrator analyzes the project:

```javascript
const scenario = await aiOrchestrator.analyzeScenario();

// Possible scenarios:
// - 'catchup': Existing project needs documentation
// - 'new-project': New project initialization
// - 'planning': Documentation exists, needs implementation plan
// - 'execution': Ready for implementation
```

### 3. Autonomous Execution Loop

The orchestrator runs continuously:

```javascript
while (isRunning) {
  // Check for user questions
  if (hasQuestions) await waitForInput();
  
  // Prepare next hook
  const hook = await prepareNextHook();
  
  // Execute via Kiro sub-agent
  const result = await kiroIntegration.invokeSubAgent({
    name: 'general-task-execution',
    prompt: enhancedPrompt,
    explanation: `Executing hook: ${hook.name}`
  });
  
  // Mark complete and continue
  await markCompleted(hook, result);
}
```

### 4. Hook Execution

Each hook is executed as a sub-agent:

```javascript
// The orchestrator invokes you (Kiro) to execute the hook
const result = await invokeSubAgent({
  name: 'general-task-execution',
  prompt: `
    ## Hook: /hsy-next-work-run
    
    ## Current Project Phase: execution
    
    ## Recently Completed Hooks:
    - /hsy-plan-setup
    - /hsy-start-next-plan
    
    [Hook's actual prompt here]
    
    ## EXECUTION INSTRUCTIONS
    
    Please provide continuous updates as you work:
    
    1. **Start**: Clearly state what you're about to do
    2. **Progress**: Show your work step-by-step
    3. **Decisions**: Explain your reasoning
    4. **Results**: Display what you've created/modified
    5. **Summary**: End with clear next steps
    
    Use this format:
    🎯 STARTING: [Task description]
    ⚙️  WORKING: [Current action]
    ✅ COMPLETED: [What was done]
    📊 RESULT: [Outcome and files]
    💡 NEXT: [Suggested next hook]
    
    ## CONFIDENCE RATING
    
    End with:
    **Confidence**: High/Medium/Low
    **Assumptions**: [List any assumptions]
    **Needs Review**: [Areas requiring human verification]
  `,
  explanation: 'Executing HSY hook: /hsy-next-work-run'
});
```

## Model Routing

The orchestrator supports different model presets:

### Ultimate Performance
```javascript
{
  orchestrator: 'claude-sonnet-4.5',
  executor: 'claude-sonnet-4.5',
  auditor: 'claude-sonnet-4.5'
}
```

### Balanced (Default)
```javascript
{
  orchestrator: 'claude-sonnet-4',
  executor: 'claude-sonnet-4',
  auditor: 'claude-sonnet-4'
}
```

### Credit-Saver
```javascript
{
  orchestrator: 'claude-sonnet-3.5',
  executor: 'claude-sonnet-3.5',
  auditor: 'claude-haiku-3.5'
}
```

## User Questions

When a hook requires user input:

```javascript
// The orchestrator pauses and emits a question event
aiOrchestrator.on('questionRequired', (data) => {
  console.log(`User input required for: ${data.hook}`);
  console.log(`Reason: ${data.reason}`);
  console.log(`Questions:`, data.questions);
});

// In TUI mode, the user answers via the UI
// In CLI mode, you (Kiro) should ask the user
```

## Integration Points

### When Kiro Invokes the Orchestrator

```javascript
// Kiro provides tool access
const tools = {
  invokeSubAgent: async (options) => { /* Kiro's implementation */ },
  readFile: async (options) => { /* Kiro's implementation */ },
  fsWrite: async (options) => { /* Kiro's implementation */ },
  executeBash: async (options) => { /* Kiro's implementation */ },
  getDiagnostics: async (options) => { /* Kiro's implementation */ }
};

// Initialize the bridge
kiroIntegration.initializeKiroTools(tools);

// Now the orchestrator can use Kiro's tools
```

### When the Orchestrator Invokes Kiro

```javascript
// The orchestrator calls back to Kiro
const result = await kiroIntegration.invokeSubAgent({
  name: 'general-task-execution',
  prompt: hookPrompt,
  explanation: `Executing hook: ${hookName}`
});

// Kiro executes the hook and returns results
```

## Example Flow

### Complete Execution Flow

```
1. User (or you) starts orchestrator:
   → invokeSubAgent('Start HSY orchestrator')

2. Orchestrator initializes:
   → Detects scenario: "execution"
   → Loads hooks
   → Starts autonomous loop

3. Orchestrator prepares first hook:
   → Hook: /hsy-next-work-run
   → Enhances prompt with context
   → Creates execution request

4. Orchestrator invokes Kiro:
   → invokeSubAgent({
       name: 'general-task-execution',
       prompt: enhancedPrompt
     })

5. You (Kiro) execute the hook:
   → Read files
   → Analyze requirements
   → Create/modify code
   → Return results

6. Orchestrator receives results:
   → Marks hook as completed
   → Updates state
   → Logs execution

7. Orchestrator continues:
   → Prepares next hook
   → Repeats steps 3-6

8. Workflow completes:
   → All hooks executed
   → Orchestrator stops
   → Returns to user
```

## Error Handling

### When a Hook Fails

```javascript
try {
  const result = await executeHook(hookData);
} catch (error) {
  // Log error
  logger.error(`Hook failed: ${error.message}`);
  
  // Pause orchestrator
  aiOrchestrator.pause();
  
  // Notify user
  emit('error', error);
  
  // Wait for user intervention
}
```

### When Kiro is Unavailable

```javascript
if (!kiroIntegration.isKiroContext()) {
  // Fall back to CLI execution
  logger.warn('Not in Kiro context, using CLI fallback');
  
  // Execute hook command directly
  const result = await execAsync(hookData.then.command);
}
```

## Best Practices

### For Kiro (You)

1. **Always provide context** when invoking the orchestrator
2. **Monitor execution** and be ready to answer questions
3. **Handle errors gracefully** and report back to user
4. **Use appropriate models** based on task complexity
5. **Provide detailed results** with file changes and summaries

### For Hook Execution

1. **Follow the format** specified in the enhanced prompt
2. **Provide continuous updates** (🎯 STARTING, ⚙️ WORKING, etc.)
3. **Include confidence ratings** (High/Medium/Low)
4. **List assumptions** made during execution
5. **Suggest next steps** for the orchestrator

### For User Interaction

1. **Pause when questions needed** - don't guess
2. **Show clear prompts** in TUI or CLI
3. **Validate answers** before continuing
4. **Resume automatically** after answers received

## Troubleshooting

### Orchestrator Won't Start

```bash
# Check installation
cd .kiro/hsy-orchestrator
npm install

# Run self-tests
node .kiro/hsy-launch test

# Check logs
tail -f .kiro/hsy-orchestrator/logs/orchestrator.log
```

### Hooks Not Executing

```bash
# Check hooks directory
ls -la .kiro/hooks/

# Verify hook format
cat .kiro/hooks/hsy-next-work-run.kiro.hook

# Check state
cat .kiro/hsy-orchestrator/state/orchestrator-state.json
```

### Kiro Integration Issues

```javascript
// Check if in Kiro context
console.log('Kiro context:', kiroIntegration.isKiroContext());

// Check available tools
console.log('Tools:', global.kiroTools);

// Test invocation
try {
  const result = await kiroIntegration.invokeSubAgent({
    name: 'general-task-execution',
    prompt: 'Test',
    explanation: 'Testing Kiro integration'
  });
  console.log('Success:', result);
} catch (error) {
  console.error('Failed:', error);
}
```

## Summary

The HSY orchestrator integrates seamlessly with Kiro:

✅ **Autonomous** - Runs continuously without manual intervention  
✅ **Intelligent** - Detects scenarios and adapts  
✅ **Integrated** - Uses Kiro's native tools  
✅ **Observable** - Provides real-time updates  
✅ **Flexible** - Supports TUI, CLI, and headless modes  
✅ **Robust** - Handles errors and edge cases  

When you (Kiro) invoke the orchestrator, it will:
1. Analyze the project
2. Execute hooks autonomously
3. Call back to you for each hook
4. Continue until complete
5. Report results

This creates a powerful autonomous development system where you (Kiro) and the orchestrator work together to implement features, fix bugs, and improve the codebase.

---

**Version**: 3.0.0  
**Status**: Production Ready  
**Last Updated**: March 4, 2026
