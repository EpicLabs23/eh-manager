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
  .option('-p, --password <password>', 'MySQL root password')
  .option('-u, --url <url>', 'EHM API public URL')
  .option('--os <url>', 'System Ubuntu version (e.g., 24.04)')
  .action(installCommand);

program
  .command('update')
  .description('Update an existing version of EHM')
  .requiredOption('-v, --version <version>', 'Specify the version to update')
  .action(updateCommand);

program.parse(process.argv);
