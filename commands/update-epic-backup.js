import Conf from 'conf';
import dotenv from 'dotenv';
import path from 'path';
import {performEpicBackupUpdate} from '../lib/epic-backup-updater.js';
import inquirer from 'inquirer';

export const updateEpicBackupCommand = async (options) => {
    const config = new Conf({ projectName: 'eh_manager' });
    const targetDir = options.targetDir || '/epiclabs23/eh/epic-backup';
    const current_epic_backup_version = config.get('current_epic_backup_version');
    
    const currentVersion = options.currentversion || current_epic_backup_version || await inquirer.prompt({
        type: 'input',
        name: 'version',
        message: 'Enter current version (e.g., 0.0.3):',
    }).then(res => res.version);
    
    // Read current env file
    const current_env_file = path.join(targetDir, currentVersion, 'epic-backup-api', '.env');
    const current_env = dotenv.config({ path: current_env_file });
    const current_env_vars = current_env.parsed;
    
    const newVersion = options.newversion || await inquirer.prompt({
        type: 'input',
        name: 'version',
        message: 'Enter New version (e.g., 0.0.3):',
    }).then(res => res.version);
    
    const apiurl = options.apiurl || current_env_vars.EHM_API_PUBLIC_URL || await inquirer.prompt({
        type: 'input',
        name: 'apiurl',
        message: 'Enter the API public URL (e.g., http://api.example.com:2333):',
        validate: input => input ? true : 'URL cannot be empty.'
    }).then(res => res.apiurl);
    
    const answers = {
        newVersion,
        apiurl,
        targetDir
    };
    
    await performEpicBackupUpdate(answers);
};
