# HSY Orchestrator

**Autonomous AI-powered orchestrator for systematic project development with Kiro integration**

[![npm version](https://img.shields.io/npm/v/hsy-orchestrator.svg)](https://www.npmjs.com/package/hsy-orchestrator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 What is HSY?

HSY (HookSystem) Orchestrator is an autonomous AI-powered system that manages your entire development workflow. It works seamlessly with [Kiro](https://kiro.ai) to provide intelligent, continuous project orchestration.

### Key Features

✅ **Fully Autonomous** - Continuous execution without manual intervention  
✅ **AI-Powered** - Intelligent decision making and scenario detection  
✅ **Kiro Integration** - Native integration with Kiro's agent system  
✅ **Beautiful TUI** - Real-time monitoring with Terminal User Interface  
✅ **Model Routing** - Choose between different AI model presets  
✅ **Scenario Detection** - Automatically adapts to your project state  
✅ **Hook System** - Extensible workflow with custom hooks  

---

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g hsy-orchestrator
```

### Local Installation

```bash
npm install hsy-orchestrator
npx hsy init
```

---

## 🎯 Quick Start

### 1. Initialize HSY in Your Repository

```bash
cd your-project
hsy init
```

This will:
- Create `.kiro` directory structure
- Install orchestrator and hooks
- Set up configuration
- Create documentation

### 2. Run the Demo

```bash
hsy demo
```

See HSY in action with an interactive demonstration.

### 3. Start the Orchestrator

```bash
hsy start
```

Launches the beautiful TUI v3.0 interface.

### 4. Or Use CLI Mode

```bash
hsy start --mode cli
```

Headless mode for automation.

---

## 🎨 Usage

### Commands

```bash
hsy init              # Initialize HSY in current repository
hsy start             # Start orchestrator (TUI mode)
hsy start --mode cli  # Start in CLI mode
hsy demo              # Run interactive demo
hsy test              # Run self-tests
hsy status            # Show current status
hsy hooks             # Manage hooks
hsy doctor            # Diagnose issues
hsy uninstall         # Remove HSY from repository
```

### Options

```bash
hsy init
  --force              # Force initialization even if .kiro exists
  --no-kiro-check      # Skip Kiro context check

hsy start
  --mode <mode>        # Launch mode: tui, cli, auto (default: tui)
  --model <preset>     # Model preset: ultimate, balanced, credit-saver, custom
```

---

## 🤖 Kiro Integration

HSY works best when invoked from within Kiro:

```javascript
// From Kiro, invoke the orchestrator
await invokeSubAgent({
  name: 'general-task-execution',
  prompt: 'Run: node .kiro/hsy-orchestrator/kiro-wrapper.js',
  explanation: 'Starting HSY autonomous orchestration'
});
```

### How It Works

1. **Kiro invokes HSY** - You start the orchestrator from Kiro
2. **HSY detects scenario** - Analyzes your project state
3. **Autonomous execution** - HSY runs continuously
4. **For each hook** - HSY invokes Kiro to execute tasks
5. **Kiro executes** - You handle the actual work
6. **Results flow back** - HSY receives and processes results
7. **Continues automatically** - Until workflow is complete

---

## 🎯 Scenarios

HSY automatically detects your project scenario:

| Scenario | Description | First Hook |
|----------|-------------|------------|
| **New Project** | Empty repository | `/hsy-startup` |
| **Catchup** | Has code, needs docs | `/hsy-catchup` |
| **Planning** | Has docs, needs plans | `/hsy-plan-setup` |
| **Execution** | Ready for implementation | `/hsy-start-next-plan` |

---

## 🎨 TUI Interface

```
╔════════════════════════════════════════════════════════════╗
║     ╦ ╦╔═╗╦ ╦  ╔═╗╦═╗╔═╗╦ ╦╔═╗╔═╗╔╦╗╦═╗╔═╗╔╦╗╔═╗╦═╗      ║
║     v3.0 - Autonomous AI Edition                          ║
╠══════════════╦═══════════════╦═══════════════════════════╣
║  📊 Status   ║ 🤖 Models     ║      📈 Metrics           ║
║  Running: ✅ ║ Balanced      ║ Total: 12                 ║
║  Mode: Active║ Sonnet 4      ║ Success: 10 ✅            ║
╠══════════════╩═══════════════╩═══════════════════════════╣
║                  🎯 Current Execution                     ║
║  Hook: /hsy-next-work-run                                ║
║  🧠 Thinking: Analyzing requirements...                   ║
║  ⚙️  Executing: Creating components...                    ║
╠════════════════════════════════════════════════════════════╣
║                  📝 Activity Log                          ║
║  [01:45:23] ℹ️ AI Orchestrator started                   ║
╠════════════════════════════════════════════════════════════╣
║ [S]tart/Stop [P]ause [M]odels [H]istory [?]Questions [Q] ║
╚════════════════════════════════════════════════════════════╝
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `S` | Start/Stop orchestrator |
| `P` | Pause/Resume |
| `M` | Model settings |
| `H` | Execution history |
| `?` | User questions |
| `R` | Refresh |
| `Q` | Quit |

---

## 🤖 Model Presets

### Ultimate Performance
```
Orchestrator: Claude Sonnet 4.5
Executor: Claude Sonnet 4.5
Auditor: Claude Sonnet 4.5
```
Best quality, highest cost

### Balanced (Default)
```
Orchestrator: Claude Sonnet 4
Executor: Claude Sonnet 4
Auditor: Claude Sonnet 4
```
Good quality, moderate cost

### Credit-Saver
```
Orchestrator: Claude Sonnet 3.5
Executor: Claude Sonnet 3.5
Auditor: Claude Haiku 3.5
```
Efficient, lower cost

### Custom
Configure your own model selection per role.

---

## 📁 Directory Structure

After initialization:

```
your-project/
├── .kiro/
│   ├── hsy-orchestrator/          # Core orchestrator
│   │   ├── src/                   # Source code
│   │   ├── state/                 # Persistent state
│   │   ├── logs/                  # Execution logs
│   │   └── config.json            # Configuration
│   ├── hooks/                     # Hook definitions
│   ├── hsy-launch                 # TUI launcher
│   ├── hsy-auto                   # CLI launcher
│   ├── hsy-demo                   # Demo script
│   └── Documentation files
├── docs/                          # Project documentation
│   ├── goals_and_principles/
│   ├── planning/
│   └── technical/
└── Your project files
```

---

## 🔧 Requirements

- **Node.js** 14.0.0 or higher
- **npm** 6.0.0 or higher
- **Git** (recommended)
- **Kiro** (for full integration)

---

## 📚 Documentation

After initialization, find comprehensive docs in `.kiro/`:

- `README.md` - Overview
- `QUICK_START.md` - Step-by-step guide
- `HSY_KIRO_INTEGRATION_GUIDE.md` - Kiro integration details
- `HSY_QUICK_REFERENCE.md` - Quick reference card

---

## 🎯 Use Cases

### New Project Setup
```bash
mkdir my-project && cd my-project
git init
hsy init
hsy start
```

### Existing Project Documentation
```bash
cd existing-project
hsy init  # Choose "Catchup" scenario
hsy start
```

### Implementation Planning
```bash
cd documented-project
hsy init  # Choose "Planning" scenario
hsy start
```

### Continuous Development
```bash
cd active-project
hsy start
# Let HSY manage your workflow autonomously
```

---

## 🔄 Workflow

```
1. Initialize HSY
   ↓
2. HSY detects scenario
   ↓
3. Autonomous loop starts
   ↓
4. For each hook:
   ├─ Prepare with context
   ├─ Invoke Kiro
   ├─ Execute task
   ├─ Receive results
   └─ Mark complete
   ↓
5. Workflow complete
```

---

## 🧪 Testing

```bash
# Run self-tests
hsy test

# Run demo
hsy demo

# Check status
hsy status

# Diagnose issues
hsy doctor
```

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🆘 Support

- **Documentation**: `.kiro/` directory after init
- **Issues**: [GitHub Issues](https://github.com/yourusername/hsy-orchestrator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/hsy-orchestrator/discussions)

---

## 🎉 Credits

Built with ❤️ for the Kiro community

---

## 📊 Status

✅ **Production Ready** - v3.0.0  
✅ **Fully Tested** - 10/10 tests passing  
✅ **Kiro Integrated** - Real invokeSubAgent calls  
✅ **Well Documented** - Comprehensive guides  

---

**The autonomous future is here!** 🚀
