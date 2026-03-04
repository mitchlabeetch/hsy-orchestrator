# Setting Up Templates

This document explains how to populate the `templates/` directory with files from the current `.kiro` installation.

## Steps to Complete Package

### 1. Create Templates Directory Structure

```bash
cd hsy-package
mkdir -p templates/orchestrator/src
mkdir -p templates/bin
mkdir -p templates/hooks
mkdir -p templates/docs
```

### 2. Copy Orchestrator Source Files

```bash
# From project root
cp .kiro/hsy-orchestrator/src/ai-orchestrator.js hsy-package/templates/orchestrator/src/
cp .kiro/hsy-orchestrator/src/kiro-orchestrator.js hsy-package/templates/orchestrator/src/
cp .kiro/hsy-orchestrator/src/kiro-integration.js hsy-package/templates/orchestrator/src/
cp .kiro/hsy-orchestrator/src/tui-v3-complete.js hsy-package/templates/orchestrator/src/
cp .kiro/hsy-orchestrator/src/tui-components.js hsy-package/templates/orchestrator/src/
cp .kiro/hsy-orchestrator/src/hook-enhancer.js hsy-package/templates/orchestrator/src/
```

### 3. Copy Wrapper and Config

```bash
cp .kiro/hsy-orchestrator/kiro-wrapper.js hsy-package/templates/orchestrator/
cp .kiro/hsy-orchestrator/package.json hsy-package/templates/orchestrator/
```

### 4. Copy Launchers

```bash
cp .kiro/hsy-launch hsy-package/templates/bin/
cp .kiro/hsy-auto hsy-package/templates/bin/
cp .kiro/hsy-demo hsy-package/templates/bin/
```

### 5. Copy Hooks

```bash
cp .kiro/hooks/*.kiro.hook hsy-package/templates/hooks/
```

### 6. Copy Documentation

```bash
cp .kiro/README.md hsy-package/templates/docs/
cp .kiro/QUICK_START.md hsy-package/templates/docs/
cp .kiro/HSY_KIRO_INTEGRATION_GUIDE.md hsy-package/templates/docs/
cp .kiro/HSY_QUICK_REFERENCE.md hsy-package/templates/docs/
```

### 7. Install Dependencies

```bash
cd hsy-package
npm install
```

### 8. Test Locally

```bash
# Link package globally
npm link

# Test in a new directory
cd ~/test-project
hsy init
hsy test
hsy demo

# Unlink when done
npm unlink -g hsy-orchestrator
```

### 9. Prepare for Publishing

```bash
cd hsy-package

# Update package.json with real repository URL
# Update README.md with real URLs
# Ensure all files are included in package.json "files" array

# Test package contents
npm pack
tar -xzf hsy-orchestrator-3.0.0.tgz
ls -la package/

# Clean up
rm -rf package hsy-orchestrator-3.0.0.tgz
```

### 10. Publish to npm

```bash
# Login to npm
npm login

# Publish
npm publish

# Or for scoped package
npm publish --access public
```

## Automated Setup Script

Create `setup-templates.sh`:

```bash
#!/bin/bash

echo "Setting up HSY package templates..."

# Create directories
mkdir -p templates/orchestrator/src
mkdir -p templates/bin
mkdir -p templates/hooks
mkdir -p templates/docs

# Copy source files
echo "Copying source files..."
cp ../.kiro/hsy-orchestrator/src/*.js templates/orchestrator/src/

# Copy wrapper and config
echo "Copying wrapper and config..."
cp ../.kiro/hsy-orchestrator/kiro-wrapper.js templates/orchestrator/
cp ../.kiro/hsy-orchestrator/package.json templates/orchestrator/

# Copy launchers
echo "Copying launchers..."
cp ../.kiro/hsy-launch templates/bin/
cp ../.kiro/hsy-auto templates/bin/
cp ../.kiro/hsy-demo templates/bin/

# Copy hooks
echo "Copying hooks..."
cp ../.kiro/hooks/*.kiro.hook templates/hooks/

# Copy documentation
echo "Copying documentation..."
cp ../.kiro/README.md templates/docs/
cp ../.kiro/QUICK_START.md templates/docs/
cp ../.kiro/HSY_KIRO_INTEGRATION_GUIDE.md templates/docs/
cp ../.kiro/HSY_QUICK_REFERENCE.md templates/docs/

echo "✅ Templates setup complete!"
echo ""
echo "Next steps:"
echo "1. npm install"
echo "2. npm link (to test locally)"
echo "3. Test in a new project"
echo "4. npm publish (when ready)"
```

Make it executable:

```bash
chmod +x setup-templates.sh
./setup-templates.sh
```

## Verification Checklist

- [ ] All source files copied
- [ ] All launchers copied
- [ ] All hooks copied
- [ ] All documentation copied
- [ ] Dependencies installed
- [ ] Local testing successful
- [ ] Package.json updated with real URLs
- [ ] README.md updated
- [ ] LICENSE file present
- [ ] .npmignore configured (if needed)
- [ ] Ready to publish

## Post-Publishing

After publishing to npm:

1. Test installation: `npm install -g hsy-orchestrator`
2. Test in clean repository
3. Create GitHub releases
4. Update documentation
5. Announce to community

---

**Status**: Ready to execute  
**Last Updated**: March 4, 2026
