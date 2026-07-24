import fs from 'fs';
import { cp } from 'fs/promises';
import path from 'path';
import axios from 'axios';
import ora from 'ora';
import * as tar from 'tar';
import { execSync } from 'child_process';
import chalk from 'chalk';
import Conf from 'conf';
import crypto from 'crypto';

const PUBLIC_RELEASE_REPO = 'EpicLabs23/epic-backup-free';

export const performEpicBackupUpdate = async ({ newVersion, apiurl, targetDir }) => {

  // Store persistent data
  const config = new Conf({ projectName: 'eh_manager' });

  const spinner = ora('Starting the install process...').start();

  try {
    const url = `https://github.com/${PUBLIC_RELEASE_REPO}/releases/download/${newVersion}/epic-backup-${newVersion}.tar.gz`;
    targetDir = targetDir || '/epiclabs23/eh/epic-backup';
    const tempDir = path.join(targetDir, 'temp');
    const extractDir = path.join(targetDir, newVersion);

    // Clean up
    spinner.text = `Cleaning up the directory: ${extractDir}`;
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
      spinner.succeed(`Cleaning up the directory: ${extractDir} completed successfully.`);
    }
    fs.mkdirSync(extractDir, { recursive: true });

    // Download
    spinner.start(`Downloading ${url}...`);
    const downloadPath = path.join(extractDir, `epic-backup-${newVersion}.tar.gz`);
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
    await tar.x({ file: downloadPath, cwd: targetDir });
    spinner.succeed(`Extracting ${downloadPath} to ${targetDir} completed successfully.`);

    const apiPath = path.join(extractDir, 'epic-backup-api');
    // const uiPath = path.join(extractDir, 'epic-backup-ui');

    // Make .env
    spinner.start(`Creating .env file...`);
    const envPath = path.join(apiPath, '.env');
    const jwtSecret = crypto.randomBytes(32).toString('hex');
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    const envContent = [
      `API_PUBLIC_URL=${apiurl}`,
      `APP_PORT=2330`,
      `JWT_SECRET="${jwtSecret}"`,
      `ENCRYPTION_KEY=${encryptionKey}`,
      `RCLONE_BASE_URL="http://localhost:5572"`,
      `RCLONE_USER="nahid"`,
      `RCLONE_PASS="SwitchKnif"`,
    ].join('\n');
    fs.writeFileSync(envPath, envContent);
    spinner.succeed(`Creating .env file completed successfully.`);

    // Run install
    execSync(`npm install --omit=dev`, { stdio: 'inherit', cwd: apiPath });

    //Copy back dev.db file
    const existingDbFile = path.join(targetDir, 'temp', 'dev.db');
    if (fs.existsSync(existingDbFile)) {
      fs.copyFileSync(existingDbFile, path.join(apiPath, 'dist/prisma/dev.db'));
    }

    // Copy back uploaded files
    const uploadsDir = path.join(targetDir, 'temp', 'files');
    if (fs.existsSync(uploadsDir)) {
      await cp(uploadsDir, path.join(apiPath, 'files'), { recursive: true });
    }

    // Update db schema if there is any
    execSync(`npx prisma db push --schema=./dist/prisma/schema.prisma`, { stdio: 'inherit', cwd: apiPath });

    // Clean up
    fs.rmSync(downloadPath);
    fs.rmSync(path.join(apiPath, 'dist/prisma/schema.prisma'));

    // Run
    const processListJson = execSync(`pm2 jlist`, { stdio: 'pipe' }).toString();

    let epicBackupApiProcess = false;
    // let epicBackupUiProcess = false;
    try {
      const processList = JSON.parse(processListJson);
      epicBackupApiProcess = processList.find(process => process.name === 'epic-backup-api');
      // epicBackupUiProcess = processList.find(process => process.name === 'epic-backup-ui');
    } catch (error) {
      console.log(error);
    }
    if (epicBackupApiProcess) {
      execSync(`pm2 delete epic-backup-api`, { stdio: 'inherit', cwd: apiPath });
    }
    execSync(`pm2 start "node dist/server.min.js" --name epic-backup-api`, { stdio: 'inherit', cwd: apiPath });

    // if (epicBackupUiProcess) {
    //   execSync(`pm2 delete epic-backup-ui`, { stdio: 'inherit', cwd: uiPath });
    // }
    // execSync(`pm2 start "serve -s -l 2331" --name epic-backup-ui`, { stdio: 'inherit', cwd: uiPath });
    execSync(`pm2 save`, { stdio: 'inherit' });

    config.set('current_epic_backup_version', newVersion);
    spinner.succeed(`Epic-backup ${newVersion} API installation completed successfully.`);
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
};
