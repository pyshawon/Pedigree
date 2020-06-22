#!/bin/sh
# Build commands from the README in order to set up a dev build quickly.
if [ ! -d "node_modules" ]; then 
  npm install -g grunt-cli
  npm install grunt --save-dev
  npm install
fi
grunt
