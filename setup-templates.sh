#!/bin/bash

# HSY Package - Template Setup Script
# Copies files from .kiro to templates directory

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     HSY Package - Template Setup                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from hsy-package directory"
    exit 1
fi

# Check if source .kiro exists
if [ ! -d "../.kiro" ]; then
    echo "❌ Error: ../.kiro directory not found"
    echo "   Make sure you're running from hsy-package/ inside the project"
    exit 1
fi

# Create directories
echo "📁 Creating template directories..."
mkdir -p templates/orchestrator/src
mkdir -p templates/bin
mkdir -p templates/hooks
mkdir -p templates/docs

# Copy source files
echo "📄 Copying orchestrator source files..."
cp ../.kiro/hsy-orchestrator/src/ai-orchestrator.js templates/orchestrator/src/
cp ../.kiro/hsy-orchestrator/src/kiro-orchestrator.js templates/orchestrator/src/
cp ../.kiro/hsy-orchestrator/src/kiro-integration.js templates/orchestrator/src/
cp ../.kiro/hsy-orchestrator/src/tui-v3-complete.js templates/orchestrator/src/
cp ../.kiro/hsy-orchestrator/src/tui-components.js templates/orchestrator/src/
cp ../.kiro/hsy-orchestrator/src/hook-enhancer.js templates/orchestrator/src/

# Copy wrapper and config
echo "📄 Copying wrapper and configuration..."
cp ../.kiro/hsy-orchestrator/kiro-wrapper.js templates/orchestrator/
cp ../.kiro/hsy-orchestrator/package.json templates/orchestrator/

# Copy launchers
echo "📄 Copying launchers..."
cp ../.kiro/hsy-launch templates/bin/
cp ../.kiro/hsy-auto templates/bin/
cp ../.kiro/hsy-demo templates/bin/

# Make launchers executable
chmod +x templates/bin/hsy-launch
chmod +x templates/bin/hsy-auto
chmod +x templates/bin/hsy-demo

# Copy hooks
echo "📄 Copying hooks..."
cp ../.kiro/hooks/*.kiro.hook templates/hooks/ 2>/dev/null || echo "⚠️  No hooks found"

# Copy documentation
echo "📄 Copying documentation..."
cp ../.kiro/README.md templates/docs/
cp ../.kiro/QUICK_START.md templates/docs/
cp ../.kiro/HSY_KIRO_INTEGRATION_GUIDE.md templates/docs/
cp ../.kiro/HSY_QUICK_REFERENCE.md templates/docs/

# Count files
SRC_COUNT=$(ls -1 templates/orchestrator/src/*.js 2>/dev/null | wc -l)
BIN_COUNT=$(ls -1 templates/bin/* 2>/dev/null | wc -l)
HOOK_COUNT=$(ls -1 templates/hooks/*.kiro.hook 2>/dev/null | wc -l)
DOC_COUNT=$(ls -1 templates/docs/*.md 2>/dev/null | wc -l)

echo ""
echo "✅ Templates setup complete!"
echo ""
echo "📊 Summary:"
echo "   Source files: $SRC_COUNT"
echo "   Launchers: $BIN_COUNT"
echo "   Hooks: $HOOK_COUNT"
echo "   Documentation: $DOC_COUNT"
echo ""
echo "📋 Next steps:"
echo "   1. npm install"
echo "   2. npm link (to test locally)"
echo "   3. cd ~/test-project && hsy init"
echo "   4. npm unlink -g hsy-orchestrator (when done testing)"
echo "   5. npm publish (when ready)"
echo ""
