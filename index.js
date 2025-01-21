#!/usr/bin/env node

import { Command } from 'commander';
import { installEhmCommand } from './commands/install-ehm.js';
import { updateEhmCommand } from './commands/update-ehm.js';
import { installEpicBackupCommand } from './commands/install-epic-backup.js';
import { updateEpicBackupCommand } from './commands/update-epic-backup.js';

const program = new Command();

program
  .name('epic')
  .description('Command-line manager for EHM');

// EHM Commands
program
  .command('install-ehm')
  .description('Install a new version of EHM')
  .option('-v, --version <version>', 'Specify the version to install')
  .option('--dbpass <dbpass>', 'MySQL root password')
  .option('--apiurl <apiurl>', 'EHM API public URL')
  .option('--os <os>', 'System Ubuntu version (e.g., 24.04)')
  .action(installEhmCommand);

program
  .command('update-ehm')
  .description('Update an existing version of EHM')
  .option('--cv, --currentversion <currentversion>', 'Specify the current version')
  .option('--nv, --newversion <newversion>', 'Specify the new version to install')
  .option('--dbpass <dbpass>', 'MySQL root password')
  .option('--apiurl <apiurl>', 'EHM API public URL')
  .option('--os <os>', 'System Ubuntu version (e.g., 24.04)')
  .action(updateEhmCommand);

// Epic Backup Commands
program
  .command('install-epic-backup')
  .description('Install a new version of epic-backup')
  .option('--version <version>', 'Specify the version to install')
  .option('--apiurl <apiurl>', 'EHM API public URL')
  .option('--targetDir <targetDir>', 'Installation directory. default is /epiclabs23/eh/epic-backup')
  .action(installEpicBackupCommand);
  
  program
  .command('update-epic-backup')
  .description('Update existing version of epic-backup')
  .option('--cv, --currentversion <currentversion>', 'Specify the current version')
  .option('--apiurl <apiurl>', 'EHM API public URL')
  .option('--targetDir <targetDir>', 'Installation directory. default is /epiclabs23/eh/epic-backup')
  .option('--newversion <newversion>', 'Specify the newversion to install')
  .action(updateEpicBackupCommand);

// Handling Exit
process.on('SIGINT', () => {
  console.log('\nInterrupted. Exiting gracefully...');
  process.exit(0);
});

process.on('exit', (code) => {
  console.log(`Exiting with code ${code}`);
});

process.on('uncaughtException', (err) => {
  // console.error('Uncaught Exception:', err);
  process.exit(1);
});


program.parse(process.argv);
