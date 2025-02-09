import Conf from 'conf';
import dotenv from 'dotenv';
import path from 'path';
import { performEpicBackupUpdate } from '../lib/epic-backup-updater.js';
import inquirer from 'inquirer';
import fs from 'fs';

export const updateEpicBackupCommand = async (options) => {
    const config = new Conf({ projectName: 'eh_manager' });
    const targetDir = options.targetDir || '/epiclabs23/eh/epic-backup';
    const current_epic_backup_version = config.get('current_epic_backup_version');

    const currentVersion = options.currentversion || current_epic_backup_version || await inquirer.prompt({
        type: 'input',
        name: 'version',
        message: 'Enter current version (e.g., 0.0.3):',
    }).then(res => res.version);

    try {
        // Read current env file
        let current_env_vars = {};
        const current_env_file = path.join(targetDir, currentVersion, 'epic-backup-api', '.env');
        if (fs.existsSync(current_env_file)) {
            console.log('current_env_file: ', current_env_file);
            const current_env = dotenv.config({ path: current_env_file });
            current_env_vars = current_env.parsed;
        }

        const newVersion = options.newversion || await inquirer.prompt({
            type: 'input',
            name: 'version',
            message: 'Enter New version (e.g., 0.0.3):',
        }).then(res => res.version);

        const apiurl = options.apiurl || current_env_vars.API_PUBLIC_URL || await inquirer.prompt({
            type: 'input',
            name: 'apiurl',
            message: 'Enter the API public URL (e.g., http://api.example.com:2330):',
            validate: input => input ? true : 'URL cannot be empty.'
        }).then(res => res.apiurl);

        const answers = {
            newVersion,
            apiurl,
            targetDir
        };

        // Backup current db file
        const db_file = path.join(targetDir, currentVersion, 'epic-backup-api', 'dist', 'prisma', 'dev.db');
        const backup_db_file = path.join(targetDir, 'temp', 'dev.db');
        
        if (fs.existsSync(db_file)) {
            fs.mkdirSync(path.join(targetDir, 'temp'), { recursive: true });
            fs.copyFileSync(db_file, backup_db_file);
        }

        // Backup uploaded files
        const uploads_dir = path.join(targetDir, currentVersion, 'epic-backup-api', 'files');
        const backup_uploads_dir = path.join(targetDir, 'temp', 'files');
        if (fs.existsSync(uploads_dir)) {
            fs.mkdirSync(backup_uploads_dir, { recursive: true });
            fs.copySync(uploads_dir, backup_uploads_dir);
        }

        // Update
        await performEpicBackupUpdate(answers);

    } catch (error) {
        console.log(error);
    }
};
