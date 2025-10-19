#!/usr/bin/env node
'use strict';

const { execSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

const projects = ['client', 'server'];

for (const project of projects) {
  const projectPath = path.resolve(__dirname, '..', project);
  if (!existsSync(projectPath)) {
    console.warn(`Skipping ${project}: directory not found at ${projectPath}`);
    continue;
  }

  console.log(`\nInstalling dependencies in ${project} (${projectPath})...`);
  try {
    execSync('npm install', { cwd: projectPath, stdio: 'inherit' });
  } catch (error) {
    console.error(`\nFailed to install dependencies in ${project}.`);
    throw error;
  }
}
