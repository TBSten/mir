#!/bin/bash

# temp directory setup
tmpdir=$(mktemp -d)
trap "rm -rf $tmpdir" EXIT

# Create a test registry
registry_dir="$tmpdir/registry"
mkdir -p "$registry_dir"

# Create a test snippet
cat > "$registry_dir/test-snippet.yaml" << 'EOF'
name: test-snippet
description: Test snippet for info command
variables:
  author:
    name: Author Name
    description: Your name
    schema:
      type: string
      default: John Doe
    suggests:
      - Alice
      - Bob
  email:
    name: Email
    description: Your email
    schema:
      type: string
EOF

# Create mirconfig
cat > "$tmpdir/mirconfig.yaml" << EOF
registries:
  - name: test
    path: $registry_dir
EOF

# Test 1: info with name (should work as before)
echo "Test 1: info with name parameter"
MIR_CONFIG_PATH="$tmpdir/mirconfig.yaml" npm run mir -- info test-snippet 2>/dev/null | head -10

# Test 2: info with --json
echo ""
echo "Test 2: info with --json"
MIR_CONFIG_PATH="$tmpdir/mirconfig.yaml" npm run mir -- info test-snippet --json 2>/dev/null | head -20

# Test 3: info with --yaml
echo ""
echo "Test 3: info with --yaml"
MIR_CONFIG_PATH="$tmpdir/mirconfig.yaml" npm run mir -- info test-snippet --yaml 2>/dev/null | head -20
