#!/bin/bash
set -e

echo "=== BotC Deducer Integration Tests ==="
echo ""

# Test 1: Check that character images exist
echo "Test 1: Character images exist"
CHARACTER_COUNT=$(find src/assets/characters -name "*.webp" | wc -l)
echo "  Found $CHARACTER_COUNT character images"
if [ "$CHARACTER_COUNT" -ge 100 ]; then
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL: Expected at least 100 character images"
  exit 1
fi
echo ""

# Test 2: Check that jinxes data exists
echo "Test 2: Jinxes data exists"
if [ -f src/assets/data/jinxes.json ]; then
  JINXES_COUNT=$(python3 -c "import json; data=json.load(open('src/assets/data/jinxes.json')); print(len(data))")
  echo "  Found $JINXES_COUNT jinx entries"
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL: jinxes.json not found"
  exit 1
fi
echo ""

# Test 3: Check that script schema exists
echo "Test 3: Script schema exists"
if [ -f src/assets/data/script-schema.json ]; then
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL: script-schema.json not found"
  exit 1
fi
echo ""

# Test 4: Check that WC25 scripts exist
echo "Test 4: WC25 scripts exist"
WC25_COUNT=$(ls src/assets/scripts/wc25/*.json 2>/dev/null | wc -l)
echo "  Found $WC25_COUNT WC25 scripts"
if [ "$WC25_COUNT" -ge 14 ]; then
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL: Expected at least 14 WC25 scripts"
  exit 1
fi
echo ""

# Test 5: Validate WC25 scripts structure
echo "Test 5: Validate WC25 scripts structure"
for script in src/assets/scripts/wc25/*.json; do
  python3 -c "
import json
import sys

try:
    with open('$script', 'r') as f:
        data = json.load(f)
    
    # WC25 scripts are arrays with mixed objects and strings
    # First object should have id='_meta'
    if not isinstance(data, list):
        print(f'  {sys.argv[1]}: not a list')
        sys.exit(1)
    
    has_meta = False
    for item in data:
        if isinstance(item, dict) and item.get('id') == '_meta':
            has_meta = True
            break
    
    if has_meta:
        print(f'  {sys.argv[1]}: valid')
    else:
        print(f'  {sys.argv[1]}: missing _meta')
        sys.exit(1)
except Exception as e:
    print(f'  {sys.argv[1]}: error - {e}')
    sys.exit(1)
" "$script" || { echo "  ✗ FAIL: Script validation failed"; exit 1; }
done
echo "  ✓ PASS"
echo ""

# Test 6: Check jinxes data structure
echo "Test 6: Jinxes data structure"
python3 -c "
import json

with open('src/assets/data/jinxes.json', 'r') as f:
    jinxes = json.load(f)

# Check that jinxes data has the expected structure
for entry in jinxes:
    assert 'id' in entry, 'Missing id in jinx entry'
    assert 'jinx' in entry, 'Missing jinx array in entry'
    for jinx in entry['jinx']:
        assert 'id' in jinx, 'Missing id in jinx'
        assert 'reason' in jinx, 'Missing reason in jinx'

print(f'  Validated {len(jinxes)} jinx entries')
print('  ✓ PASS')
" || { echo "  ✗ FAIL: Jinxes data validation failed"; exit 1; }
echo ""

echo "=== All Integration Tests Passed ==="