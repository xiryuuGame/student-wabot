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

# Ask user if they want to install pm2
while true; do
  read -r -p "Do you want to install pm2 globally? [y/n] (default: y) " install_pm2
  case "$install_pm2" in
    ""|[yY])
      npm install -g pm2
      break
      ;;
    [nN])
      break
      ;;
    *)
      echo "Invalid input. Please answer 'y' or 'n'."
      ;;
  esac
done
