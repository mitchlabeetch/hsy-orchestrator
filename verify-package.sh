#!/bin/bash

# HSY Package Verification Script
# Verifies package is ready for publishing

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     HSY Package - Verification                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

ERRORS=0
WARNINGS=0

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from hsy-package directory"
    exit 1
fi

echo "📋 Checking package structure..."

# Check bin
if [ -f "bin/hsy.js" ]; then
    echo "✅ bin/hsy.js exists"
    if [ -x "bin/hsy.js" ]; then
        echo "✅ bin/hsy.js is executable"
    else
        echo "❌ bin/hsy.js is not executable"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "❌ bin/hsy.js missing"
    ERRORS=$((ERRORS + 1))
fi

# Check dist
if [ -d "dist" ]; then
    echo "✅ dist/ directory exists"
    COMMAND_COUNT=$(ls -1 dist/commands/*.js 2>/dev/null | wc -l)
    echo "✅ Found $COMMAND_COUNT command files"
else
    echo "❌ dist/ directory missing"
    ERRORS=$((ERRORS + 1))
fi

# Check templates
if [ -d "templates" ]; then
    echo "✅ templates/ directory exists"
    
    # Check source files
    if [ -d "templates/orchestrator/src" ]; then
        SRC_COUNT=$(ls -1 templates/orchestrator/src/*.js 2>/dev/null | wc -l)
        if [ "$SRC_COUNT" -eq 6 ]; then
            echo "✅ All 6 source files present"
        else
            echo "⚠️  Expected 6 source files, found $SRC_COUNT"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo "❌ templates/orchestrator/src missing"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check launchers
    if [ -d "templates/bin" ]; then
        BIN_COUNT=$(ls -1 templates/bin/* 2>/dev/null | wc -l)
        if [ "$BIN_COUNT" -eq 3 ]; then
            echo "✅ All 3 launchers present"
        else
            echo "⚠️  Expected 3 launchers, found $BIN_COUNT"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo "❌ templates/bin missing"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check hooks
    if [ -d "templates/hooks" ]; then
        HOOK_COUNT=$(ls -1 templates/hooks/*.kiro.hook 2>/dev/null | wc -l)
        if [ "$HOOK_COUNT" -gt 0 ]; then
            echo "✅ Found $HOOK_COUNT hooks"
        else
            echo "⚠️  No hooks found"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo "❌ templates/hooks missing"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check docs
    if [ -d "templates/docs" ]; then
        DOC_COUNT=$(ls -1 templates/docs/*.md 2>/dev/null | wc -l)
        if [ "$DOC_COUNT" -eq 4 ]; then
            echo "✅ All 4 documentation files present"
        else
            echo "⚠️  Expected 4 docs, found $DOC_COUNT"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo "❌ templates/docs missing"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "❌ templates/ directory missing"
    ERRORS=$((ERRORS + 1))
fi

# Check required files
echo ""
echo "📋 Checking required files..."

if [ -f "package.json" ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json missing"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "README.md" ]; then
    echo "✅ README.md exists"
else
    echo "❌ README.md missing"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "LICENSE" ]; then
    echo "✅ LICENSE exists"
else
    echo "❌ LICENSE missing"
    ERRORS=$((ERRORS + 1))
fi

if [ -f ".npmignore" ]; then
    echo "✅ .npmignore exists"
else
    echo "⚠️  .npmignore missing (optional)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check node_modules
echo ""
echo "📋 Checking dependencies..."

if [ -d "node_modules" ]; then
    echo "✅ node_modules exists"
    PKG_COUNT=$(ls -1 node_modules 2>/dev/null | wc -l)
    echo "✅ Found $PKG_COUNT packages"
else
    echo "❌ node_modules missing - run: npm install"
    ERRORS=$((ERRORS + 1))
fi

# Test npm pack
echo ""
echo "📋 Testing package build..."

if npm pack --dry-run > /dev/null 2>&1; then
    echo "✅ npm pack successful"
    
    # Get package info
    PKG_INFO=$(npm pack --dry-run 2>&1)
    PKG_SIZE=$(echo "$PKG_INFO" | grep "package size" | awk '{print $4, $5}')
    TOTAL_FILES=$(echo "$PKG_INFO" | grep "total files" | awk '{print $4}')
    
    echo "   Package size: $PKG_SIZE"
    echo "   Total files: $TOTAL_FILES"
else
    echo "❌ npm pack failed"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED!"
    echo ""
    echo "🚀 Package is ready to publish!"
    echo ""
    echo "Next steps:"
    echo "  1. npm login"
    echo "  2. npm publish"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  PASSED WITH WARNINGS"
    echo ""
    echo "Warnings: $WARNINGS"
    echo ""
    echo "Package can be published, but review warnings above."
    echo ""
    exit 0
else
    echo "❌ VERIFICATION FAILED"
    echo ""
    echo "Errors: $ERRORS"
    echo "Warnings: $WARNINGS"
    echo ""
    echo "Please fix errors before publishing."
    echo ""
    exit 1
fi
