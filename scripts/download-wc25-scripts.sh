#!/bin/bash
# Download WC25 championship scripts from the official BotC Release repository
# Usage: ./scripts/download-wc25-scripts.sh

set -e

REPO_URL="https://github.com/ThePandemoniumInstitute/botc-release"
TARGET_DIR="src/assets/scripts/wc25"

echo "Downloading WC25 championship scripts from ${REPO_URL}..."

# Clone the repo to a temp directory
TEMP_DIR=$(mktemp -d)
git clone --depth 1 --sparse ${REPO_URL} ${TEMP_DIR}
cd ${TEMP_DIR}
git sparse-checkout set wc25
cd -

# Remove existing WC25 scripts
rm -rf ${TARGET_DIR}
mkdir -p ${TARGET_DIR}

# Copy all script.json files from WC25 subdirectories
COUNT=0
for f in $(find ${TEMP_DIR}/wc25 -name "script.json" -type f); do
  dir=$(dirname $f)
  script_name=$(basename $dir)
  cp "$f" "${TARGET_DIR}/${script_name}.json"
  COUNT=$((COUNT + 1))
  echo "  Copied ${script_name}.json"
done

# Clean up
rm -rf ${TEMP_DIR}

echo "Downloaded ${COUNT} WC25 championship scripts to ${TARGET_DIR}"
echo "Done!"
