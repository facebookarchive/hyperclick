#!/usr/bin/env node
'use strict';
/* @noflow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

const fs = require('fs');
const path = require('path');

const babel = require('babel-core');

// https://github.com/atom/atom/blob/v1.6.1/static/babelrc.json
const defaultOpts = {
  breakConfig: true,
  sourceMap: 'inline',
  blacklist: ['es6.forOf', 'useStrict'],
  optional: ['asyncToGenerator'],
  stage: 0,
};

[
  'Hyperclick.js',
  'HyperclickForTextEditor.js',
  'SuggestionList.js',
  'SuggestionListElement.js',
  'hyperclick-utils.js',
  'main.js',
].forEach(name => {
  console.log('Transpiling %j', name);

  const filename = path.join(__dirname, '../lib', name);
  const opts = Object.assign({filename: filename}, defaultOpts);

  const src = fs.readFileSync(filename, 'utf8');
  const output = babel.transform(src, opts).code;

  fs.writeFileSync(filename, output);
});

const mainJsFlow = `\
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

export type {
  HyperclickProvider,
  HyperclickSuggestion,
} from './types';
`;

fs.writeFileSync(
  path.join(__dirname, '../lib/main.js.flow'),
  mainJsFlow
);
