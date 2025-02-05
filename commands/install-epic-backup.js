import { performEpicBackupInstall } from '../lib/epic-backup-installer.js';
import { installEpicBackupSystemDependecy } from './install-epic-backup-system-dependecy.js';
import inquirer from 'inquirer';

export const installEpicBackupCommand = async (options) => {
    const version = options.version ? options.version : await inquirer.prompt({
        type: 'input',
        name: 'version',
        message: 'Enter Epic Backup version (e.g., 0.0.3):',
    }).then(res => res.version);
    
    const apiurl = options.apiurl || await inquirer.prompt({
        type: 'input',
        name: 'apiurl',
        message: 'Enter the Epic Backup API public URL (e.g., http://eb.epiclabs23.com:2330):',
        validate: input => input ? true : 'URL cannot be empty.'
    }).then(res => res.apiurl);

    const answers = {
        version,
        apiurl,
        targetDir: options.targetDir
    };

    
    const installDependecy = await inquirer.prompt({
        type: 'confirm',
        name: 'installDependecy',
        message: 'Install required system dependecies?',
    }).then(res => res.installDependecy);

    if (installDependecy) {
        await installEpicBackupSystemDependecy();
    }
    
    await performEpicBackupInstall(answers);
};
