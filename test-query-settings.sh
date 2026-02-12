#!/bin/bash

# Test script for query settings features
# This script tests the new /query-settings and /show-prompt commands

echo "Testing Query Settings and Show Prompt features..."
echo ""

# Start chat with test commands
cat << 'EOF' | npm run chat
/query-settings
/query-settings set top-k 5
/query-settings
/show-prompt on
/show-prompt
/query-settings
/show-prompt off
/query-settings
/exit
EOF
