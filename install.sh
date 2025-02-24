#!/bin/bash

# Create temporary directory
mkdir -p ./temp
mkdir -p ./AIHistory

# Install npm dependencies
npm i

# Create directories for subjects
for mapel in "AIJ" "ASJ" "B_INDO" "B_INGGRIS" "MTK" "MANDARIN" "PAI" "PJOK" "PKN" "RPL" "SEJARAH" "TLJ-PKK" "WAN"; do
  mkdir -p "./function/mapel/$mapel"
done
