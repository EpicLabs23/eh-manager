#!/usr/bin/env node

import { Command } from 'commander';
import { installCommand } from './commands/install.js';
import { updateCommand } from './commands/update.js';

const program = new Command();

program
  .name('eh-manager')
  .description('Command-line manager for EHM');

program
  .command('install')
  .description('Install a new version of EHM')
  .option('-v, --version <version>', 'Specify the version to install')
  .option('--dbpass <dbpass>', 'MySQL root password')
  .option('--apiurl <apiurl>', 'EHM API public URL')
  .option('--os <os>', 'System Ubuntu version (e.g., 24.04)')
  .action(installCommand);

program
  .command('update')
  .description('Update an existing version of EHM')
  .requiredOption('-v, --version <version>', 'Specify the version to update')
  .action(updateCommand);

program.parse(process.argv);
