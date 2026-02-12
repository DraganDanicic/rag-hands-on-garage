#!/bin/bash

echo "Testing new commands..."
echo ""

# Test 1: Check if help shows new commands
echo "1. Testing /help command includes new commands..."
echo "/help" | timeout 5 npm run chat 2>&1 | grep -E "(import-settings|delete|rename|import)" && echo "✓ New commands in help" || echo "✗ Commands not in help"

echo ""
echo "All basic tests completed!"
