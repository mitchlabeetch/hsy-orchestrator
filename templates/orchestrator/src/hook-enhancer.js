#!/usr/bin/env node

/**
 * Hook Enhancer - Improves hooks with better streaming and interaction
 * 
 * Adds:
 * - Progress indicators
 * - Streaming output
 * - Better error handling
 * - User interaction prompts
 * - Confidence ratings
 */

const fs = require('fs');
const path = require('path');

class HookEnhancer {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this.hooksDir = path.join(workspaceRoot, '.kiro/hooks');
  }
  
  /**
   * Enhance all hooks with improved prompts
   */
  async enhanceAllHooks() {
    if (!fs.existsSync(this.hooksDir)) {
      console.error('Hooks directory not found');
      return;
    }
    
    const hookFiles = fs.readdirSync(this.hooksDir)
      .filter(f => f.endsWith('.kiro.hook') && !f.includes('.backup'));
    
    console.log(`Found ${hookFiles.length} hooks to enhance`);
    
    for (const hookFile of hookFiles) {
      await this.enhanceHook(hookFile);
    }
    
    console.log('All hooks enhanced!');
  }
  
  /**
   * Enhance a single hook
   */
  async enhanceHook(hookFile) {
    const hookPath = path.join(this.hooksDir, hookFile);
    
    try {
      const hookData = JSON.parse(fs.readFileSync(hookPath, 'utf8'));
      
      // Add streaming instructions if not present
      if (!hookData.then.prompt.includes('STREAMING')) {
        hookData.then.prompt = this.addStreamingInstructions(hookData.then.prompt);
      }
      
      // Add progress indicators if not present
      if (!hookData.then.prompt.includes('PROGRESS')) {
        hookData.then.prompt = this.addProgressInstructions(hookData.then.prompt);
      }
      
      // Add confidence rating if not present
      if (!hookData.then.prompt.includes('CONFIDENCE')) {
        hookData.then.prompt = this.addConfidenceInstructions(hookData.then.prompt);
      }
      
      // Backup original
      const backupPath = hookPath + '.pre-enhance-backup';
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, JSON.stringify(hookData, null, 2));
      }
      
      // Write enhanced version
      fs.writeFileSync(hookPath, JSON.stringify(hookData, null, 2));
      
      console.log(`✅ Enhanced: ${hookFile}`);
      
    } catch (error) {
      console.error(`❌ Failed to enhance ${hookFile}: ${error.message}`);
    }
  }
  
  addStreamingInstructions(prompt) {
    const streamingSection = `

## STREAMING OUTPUT INSTRUCTIONS

As you work through this hook, provide continuous updates:

1. **Start with a clear plan**: Outline what you'll do
2. **Stream progress**: Show what you're doing as you do it
3. **Explain decisions**: Share your reasoning
4. **Show results**: Display what you've created/modified
5. **Summarize**: End with a clear summary

Use this format:
\`\`\`
🎯 PLAN: [What you'll do]
⚙️  WORKING: [Current action]
✅ DONE: [What was completed]
📊 RESULT: [Outcome]
\`\`\`

`;
    
    return streamingSection + prompt;
  }
  
  addProgressInstructions(prompt) {
    const progressSection = `

## PROGRESS INDICATORS

Show progress throughout execution:

- Use emojis for visual clarity (🎯 ⚙️ ✅ ❌ ⚠️ 📊)
- Number steps (Step 1/5, Step 2/5, etc.)
- Show percentage completion when applicable
- Indicate time estimates for long operations
- Display file counts, line counts, etc.

Example:
\`\`\`
Step 1/5: Analyzing codebase... ⚙️
  - Scanned 45 files
  - Found 12 components
  - Identified 3 issues
  ✅ Analysis complete (2.3s)

Step 2/5: Creating documentation... ⚙️
\`\`\`

`;
    
    return progressSection + prompt;
  }
  
  addConfidenceInstructions(prompt) {
    const confidenceSection = `

## CONFIDENCE RATING

At the end of your response, provide a confidence rating:

**Confidence: [High/Medium/Low]**

- **High**: All information verified, no assumptions made
- **Medium**: Some assumptions, but reasonable
- **Low**: Significant uncertainty, needs human review

Also note:
- **Assumptions Made**: List any assumptions
- **Needs Review**: Areas requiring human verification
- **Risks**: Potential issues or concerns

`;
    
    return confidenceSection + prompt;
  }
  
  /**
   * Restore original hooks from backup
   */
  async restoreHooks() {
    const hookFiles = fs.readdirSync(this.hooksDir)
      .filter(f => f.endsWith('.pre-enhance-backup'));
    
    for (const backupFile of hookFiles) {
      const originalFile = backupFile.replace('.pre-enhance-backup', '');
      const backupPath = path.join(this.hooksDir, backupFile);
      const originalPath = path.join(this.hooksDir, originalFile);
      
      fs.copyFileSync(backupPath, originalPath);
      console.log(`✅ Restored: ${originalFile}`);
    }
    
    console.log('All hooks restored from backup');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'enhance';
  
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
  const enhancer = new HookEnhancer(workspaceRoot);
  
  async function run() {
    if (command === 'enhance') {
      await enhancer.enhanceAllHooks();
    } else if (command === 'restore') {
      await enhancer.restoreHooks();
    } else {
      console.log('Usage: node hook-enhancer.js [enhance|restore]');
    }
  }
  
  run().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { HookEnhancer };
