#!/bin/bash
set -e

# Remove existing source
rm -rf /tmp/*

# Download source
curl -s -o /tmp/source.zip $SOURCE_URL

# Unzip
unzip -q /tmp/source.zip -d /tmp/source

# Move source from the extracted folder up a level
mv /tmp/source/**/* /tmp/source

# Change into source dir
cd /tmp/source

# Set NPM cache to /tmp
export NPM_CONFIG_CACHE=/tmp/npm-cache

# Install deps
npm install --no-optional

# Run unit tests
npm run test

# Production build
npm run build

# Upload (custom script)
npm run upload