import { performEpicBackupInstall } from '../lib/epic-backup-installer.js';
import inquirer from 'inquirer';

export const installEpicBackupCommand = async (options) => {
    const version = options.version ? options.version : await inquirer.prompt({
        type: 'input',
        name: 'version',
        message: 'Enter Epic Backup version (e.g., 0.0.3):',
    }).then(res => res.version);
    
    const apiPublicUrl = options.apiurl || await inquirer.prompt({
        type: 'input',
        name: 'apiPublicUrl',
        message: 'Enter the Epic Backup API public URL (e.g., http://eb.epiclabs23.com:2333):',
        validate: input => input ? true : 'URL cannot be empty.'
    }).then(res => res.apiPublicUrl);

    const answers = {
        version,
        apiPublicUrl,
        targetDir: options.targetDir
    };

    await performEpicBackupInstall(answers);
};
