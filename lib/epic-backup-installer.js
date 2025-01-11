import fs from 'fs';
import path from 'path';
import axios from 'axios';
import ora from 'ora';
import * as tar from 'tar';
import { execSync } from 'child_process';
import chalk from 'chalk';
import Conf from 'conf';
import crypto from 'crypto';

export const performEpicBackupInstall = async ({ version, apiurl, targetDir }) => {

  // Store persistent data
  const config = new Conf({projectName: 'eh_manager'});
  
  const spinner = ora('Starting the install process...').start();

  try {
    const url = `http://release.epiclabs23.com/epic-backup-${version}.tar.gz`;
    targetDir = targetDir || '/epiclabs23/eh/epic-backup';
    const extractDir = path.join(targetDir, version);

    // Clean up
    spinner.text = `Cleaning up the directory: ${extractDir}`;
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
      spinner.succeed(`Cleaning up the directory: ${extractDir} completed successfully.`);
    }
    fs.mkdirSync(extractDir, { recursive: true });

    // Download
    spinner.start(`Downloading ${url}...`);
    const downloadPath = path.join(extractDir, `epic-backup-${version}.tar.gz`);
    spinner.text = `Downloading ${url} to ${downloadPath}...`;
    const writer = fs.createWriteStream(downloadPath);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', () => {
        spinner.succeed(`Downloading ${url} to ${downloadPath} completed successfully.`);
        resolve();
      });
      writer.on('error', (error) => {
        spinner.fail(chalk.red(`Error: ${error.message}`));
        reject(error);
      });
    });

    // Extract
    spinner.start(`Extracting ${downloadPath} to ${targetDir}...`);
    await tar.x({ file: downloadPath, cwd: extractDir });
    spinner.succeed(`Extracting ${downloadPath} to ${targetDir} completed successfully.`);

    const apiPath = path.join(extractDir, version, 'epic-backup-api');
    const uiPath = path.join(extractDir, version, 'epic-backup-ui');

    // Make .env
    spinner.start(`Creating .env file...`);
    const envPath = path.join(extractDir, '.env');
    const jwtSecret = crypto.randomBytes(32).toString('hex');
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    const envContent = `API_PUBLIC_URL=${apiurl}\nAPP_PORT=2333\nJWT_SECRET="${jwtSecret}"\nENCRYPTION_KEY=${encryptionKey}`;
    fs.writeFileSync(envPath, envContent);
    spinner.succeed(`Creating .env file completed successfully.`);

    // Run install
    execSync(`npm install --omit=dev`, { stdio: 'inherit', cwd: apiPath });
    execSync(`npx prisma db push --schema=./dist/prisma/schema.prisma`, { stdio: 'inherit', cwd: apiPath });

    // Clean up
    fs.rmSync(downloadPath);
    fs.rmSync(path.join(apiPath, 'dist/prisma/schema.prisma'));

    // Run
    const processListJson = execSync(`pm2 jlist`, { stdio: 'pipe' }).toString();
    const processList = JSON.parse(processListJson);
    const epicBackupApiProcess = processList.find(process => process.name === 'epic-backup-api');
    if (epicBackupApiProcess) {
        execSync(`pm2 delete epic-backup-api`, { stdio: 'inherit', cwd: apiPath });
    }
    execSync(`pm2 start "node dist/main" --name epic-backup-api`, { stdio: 'inherit', cwd: apiPath });
    
    const epicBackupUiProcess = processList.find(process => process.name === 'epic-backup-ui');
    if (epicBackupUiProcess) {
      execSync(`pm2 delete epic-backup-ui`, { stdio: 'inherit', cwd: uiPath });
    }
    execSync(`pm2 start "serve -s build -l 2332" --name epic-backup-ui`, { stdio: 'inherit', cwd: uiPath });

    // Save current version to use in future update process
    config.set('current_epic_backup_version', version);
    spinner.succeed(`Epic-backup ${version} API installation completed successfully.`);
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
};
