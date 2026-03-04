# HSY v3.0 - Quick Reference Card

## 🚀 Launch Commands

```bash
# Demo (see it in action)
node .kiro/hsy-demo

# Self-tests
node .kiro/hsy-launch test

# TUI mode (interactive)
node .kiro/hsy-launch

# CLI mode (headless)
node .kiro/hsy-auto

# Direct wrapper (for Kiro)
node .kiro/hsy-orchestrator/kiro-wrapper.js
```

## 🤖 From Kiro

```javascript
// Start orchestrator
await invokeSubAgent({
  name: 'general-task-execution',
  prompt: 'Run: node .kiro/hsy-orchestrator/kiro-wrapper.js',
  explanation: 'Starting HSY autonomous orchestration'
});

// Launch TUI
await invokeSubAgent({
  name: 'general-task-execution',
  prompt: 'Run: node .kiro/hsy-launch',
  explanation: 'Launching HSY TUI'
});
```

## ⌨️ TUI Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `S` | Start/Stop orchestrator |
| `P` | Pause/Resume |
| `M` | Model settings |
| `H` | Execution history |
| `?` | User questions |
| `R` | Refresh |
| `Q` | Quit |

## 🎨 Model Presets

| Preset | Orchestrator | Executor | Auditor | Use Case |
|--------|-------------|----------|---------|----------|
| Ultimate | Sonnet 4.5 | Sonnet 4.5 | Sonnet 4.5 | Best quality |
| Balanced | Sonnet 4 | Sonnet 4 | Sonnet 4 | Default |
| Credit-Saver | Sonnet 3.5 | Sonnet 3.5 | Haiku 3.5 | Budget |
| Custom | User-defined | User-defined | User-defined | Flexible |

## 📁 Key Files

```
.kiro/
├── hsy-orchestrator/
│   ├── src/
│   │   ├── kiro-orchestrator.js      # Base orchestrator
│   │   ├── ai-orchestrator.js        # AI-powered orchestrator
│   │   ├── kiro-integration.js       # Kiro tools bridge
│   │   ├── tui-v3-complete.js        # TUI v3
│   │   └── tui-components.js         # TUI components
│   ├── kiro-wrapper.js               # Kiro entry point
│   └── state/                        # Persistent state
├── hooks/                            # Hook definitions
├── hsy-launch                        # Main launcher
├── hsy-auto                          # CLI mode
├── hsy-demo                          # Demo script
├── HSY_KIRO_INTEGRATION_GUIDE.md    # Integration guide
└── QUICK_START.md                    # Quick start
```

## 🔄 Execution Flow

```
1. Kiro invokes orchestrator
   ↓
2. Orchestrator detects scenario
   ↓
3. Autonomous loop starts
   ↓
4. For each hook:
   - Prepare with context
   - Invoke Kiro
   - Receive results
   - Mark complete
   ↓
5. Workflow complete
```

## 🎯 Scenarios

| Scenario | Description | First Hook |
|----------|-------------|------------|
| catchup | Existing project, no docs | /hsy-catchup |
| new-project | Empty repository | /hsy-startup |
| planning | Has docs, no plans | /hsy-plan-setup |
| execution | Ready for implementation | /hsy-start-next-plan |

## 🔧 Troubleshooting

```bash
# Check installation
cd .kiro/hsy-orchestrator && npm install

# Run self-tests
node .kiro/hsy-launch test

# Check logs
tail -f .kiro/hsy-orchestrator/logs/orchestrator.log

# Verify hooks
ls -la .kiro/hooks/

# Check state
cat .kiro/hsy-orchestrator/state/orchestrator-state.json
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `HSY_V3_INTEGRATION_COMPLETE.md` | Complete summary |
| `.kiro/HSY_KIRO_INTEGRATION_GUIDE.md` | Integration guide |
| `.kiro/QUICK_START.md` | Quick start |
| `HSY_V3_IMPLEMENTATION_COMPLETE.md` | Implementation details |
| `CONTEXT_TRANSFER_COMPLETE.md` | Session summary |

## 🎨 TUI Panels

1. **Status** - Running state, mode, pending hook
2. **Models** - Current preset, model details
3. **Metrics** - Execution counts, success/fail
4. **Execution** - Current hook, streaming
5. **Activity Log** - Timestamped events

## 🔑 Key Concepts

### Kiro Integration
- Uses `invokeSubAgent` for hook execution
- Automatic context detection
- Graceful fallbacks to CLI

### Model Routing
- Different models for different roles
- Presets for common scenarios
- Custom configuration support

### Autonomous Loop
- Continuous execution
- No manual intervention
- User questions handled in TUI

### Scenario Detection
- Analyzes project state
- Determines appropriate workflow
- Suggests first hook

## ⚡ Quick Tips

1. **First time?** Run `node .kiro/hsy-demo`
2. **Testing?** Run `node .kiro/hsy-launch test`
3. **Interactive?** Run `node .kiro/hsy-launch`
4. **From Kiro?** Use `invokeSubAgent` with wrapper
5. **Headless?** Run `node .kiro/hsy-auto`

## 🎉 Success Indicators

✅ Self-tests pass  
✅ TUI launches  
✅ Hooks execute  
✅ State updates  
✅ Logs appear  

## 📞 Help

```bash
# Show help
node .kiro/hsy-launch --help

# Read integration guide
cat .kiro/HSY_KIRO_INTEGRATION_GUIDE.md

# View quick start
cat .kiro/QUICK_START.md
```

---

**Version**: 3.0.0  
**Status**: Production Ready  
**Last Updated**: March 4, 2026
