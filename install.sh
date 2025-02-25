#!/bin/bash

# Create temporary directory
mkdir -p ./temp
mkdir -p ./AIHistory


# Extract unique subjects from mapel.json
subjects=$(jq -r 'values | flatten | unique | .[]' mapel.json)

# Create directories for subjects
for mapel in $subjects; do
  formatted_mapel=$(echo "$mapel" | tr ' ' '-' | tr '[:lower:]' '[:upper:]')
  mkdir -p "./function/mapel/$formatted_mapel"
done

# Install npm dependencies
npm i

# Create .env file with GEMINI_API_KEY
echo "GEMINI_API_KEY=*****" > .env