#!/bin/bash

node_modules/.bin/webpack --config webpack.prod.js
rm -rf keymaps styles scripts webpack* yarn.lock
cp -r node_modules/atom-ide-ui/pkg/hyperclick/{keymaps,styles} .
