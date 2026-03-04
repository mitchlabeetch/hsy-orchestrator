# HSY Autonomous Orchestrator v3.0

Production-ready autonomous orchestration system with full Kiro integration.

## 🚀 Quick Start

```bash
# Demo (see it in action)
node .kiro/hsy-demo

# Self-tests
node .kiro/hsy-launch test

# Launch TUI v3.0
node .kiro/hsy-launch

# CLI mode (headless)
node .kiro/hsy-auto
```

## 📁 Directory Structure

```
.kiro/
├── hsy-orchestrator/          # Core orchestrator
│   ├── src/
│   │   ├── ai-orchestrator.js        # AI-powered orchestrator
│   │   ├── kiro-orchestrator.js      # Base orchestrator
│   │   ├── kiro-integration.js       # Kiro tools bridge
│   │   ├── tui-v3-complete.js        # TUI v3.0
│   │   ├── tui-components.js         # TUI components
│   │   └── hook-enhancer.js          # Hook enhancement
│   ├── state/                        # Persistent state
│   ├── logs/                         # Execution logs
│   ├── kiro-wrapper.js               # Kiro entry point
│   ├── config.json                   # Configuration
│   ├── package.json                  # Dependencies
│   └── README.md                     # Orchestrator docs
├── hooks/                     # Hook definitions
├── hsy-launch                 # Main launcher (TUI/CLI)
├── hsy-auto                   # CLI mode launcher
├── hsy-demo                   # Interactive demo
├── HSY_KIRO_INTEGRATION_GUIDE.md    # Integration guide
├── HSY_QUICK_REFERENCE.md           # Quick reference
├── QUICK_START.md                   # Quick start guide
└── README.md                        # This file
```

## 🤖 From Kiro

```javascript
// Start orchestrator
await invokeSubAgent({
  name: 'general-task-execution',
  prompt: 'Run: node .kiro/hsy-orchestrator/kiro-wrapper.js',
  explanation: 'Starting HSY autonomous orchestration'
});
```

## ⌨️ TUI Shortcuts

| Key | Action |
|-----|--------|
| `S` | Start/Stop |
| `P` | Pause/Resume |
| `M` | Model settings |
| `H` | History |
| `?` | Questions |
| `Q` | Quit |

## 📚 Documentation

- `QUICK_START.md` - Quick start guide
- `HSY_KIRO_INTEGRATION_GUIDE.md` - Complete integration guide
- `HSY_QUICK_REFERENCE.md` - Quick reference card
- `hsy-orchestrator/README.md` - Orchestrator details

## 🎯 Features

✅ Fully autonomous execution  
✅ Real Kiro integration  
✅ Model routing (4 presets)  
✅ Beautiful TUI v3.0  
✅ Scenario detection  
✅ User question handling  
✅ Execution history  
✅ Real-time streaming  

## 🔧 Requirements

- Node.js 14+
- npm packages (auto-installed)
- Kiro (for full integration)

## 📖 Learn More

```bash
# Read quick start
cat .kiro/QUICK_START.md

# Read integration guide
cat .kiro/HSY_KIRO_INTEGRATION_GUIDE.md

# Read quick reference
cat .kiro/HSY_QUICK_REFERENCE.md
```

---

**Version**: 3.0.0  
**Status**: Production Ready  
**Last Updated**: March 4, 2026
