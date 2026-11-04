#!/bin/bash
# Download character images from the official BotC Release repository
# Usage: ./scripts/download-characters.sh

set -e

REPO_URL="https://github.com/ThePandemoniumInstitute/botc-release"
TARGET_DIR="src/assets/characters"

echo "Downloading character images from ${REPO_URL}..."

# Clone the repo to a temp directory
TEMP_DIR=$(mktemp -d)
git clone --depth 1 --sparse ${REPO_URL} ${TEMP_DIR}
cd ${TEMP_DIR}
git sparse-checkout set resources/characters
cd -

# Remove existing character images
rm -rf ${TARGET_DIR}
mkdir -p ${TARGET_DIR}

# Copy character images
cp -r ${TEMP_DIR}/resources/characters/* ${TARGET_DIR}/

# Clean up
rm -rf ${TEMP_DIR}

# Count and report
TOTAL_FILES=$(find ${TARGET_DIR} -name "*.webp" | wc -l)
echo "Downloaded ${TOTAL_FILES} character image files to ${TARGET_DIR}"

for dir in ${TARGET_DIR}/*/; do
    COUNT=$(find ${dir} -name "*.webp" | wc -l)
    echo "  $(basename ${dir}): ${COUNT} files"
done

echo "Done!"
