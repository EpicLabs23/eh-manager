import fs from 'fs';
import path from 'path';
import axios from 'axios';
import ora from 'ora';
import * as tar from 'tar';
import { execSync } from 'child_process';
import chalk from 'chalk';
import Conf from 'conf';

export const performEpicBackupInstall = async ({ version, apiPublicUrl }) => {

  // Store persistent data
  const config = new Conf({projectName: 'eh_manager'});
  
  const spinner = ora('Starting the install process...').start();

  try {
    const url = `http://epiclabs23.com/epic-backup-api-${version}.tar.gz`;
    // const targetDir = '/epiclabs23/eh/epic-backup';
    const targetDir = '/epiclabs23/eh-prod/epic-backup';
    console.log('Ok? ', version);
    const extractDir = path.join(targetDir, version);

    // Clean up
    spinner.text = `Cleaning up the directory: ${extractDir}`;
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
      spinner.succeed(`Cleaning up the directory: ${extractDir} completed successfully.`);
    }
    fs.mkdirSync(targetDir, { recursive: true });

    // Download
    spinner.start(`Downloading ${url}...`);
    const downloadPath = path.join(targetDir, `epic-backup-api-${version}.tar.gz`);
    spinner.text = `Downloading ${url} to ${downloadPath}...`;
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    const writer = fs.createWriteStream(downloadPath);
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

    // Make .env
    spinner.start(`Creating .env file...`);
    const envPath = path.join(extractDir, '.env');
    const jwtSecret = Math.random().toString(36).substring(2, 15);
    const encryptionKey = Math.random().toString(36).substring(2, 15);
    const envContent = `API_PUBLIC_URL=${apiPublicUrl}\nAPP_PORT=2333\nJWT_SECRET="${jwtSecret}"\nENCRYPTION_KEY=${encryptionKey}`;
    fs.writeFileSync(envPath, envContent);
    spinner.succeed(`Creating .env file completed successfully.`);

    // Run install
    execSync(`npm install --omit=dev`, { stdio: 'inherit' });
    execSync(`npx prisma db push --schema=./dist/prisma/schema.prisma`, { stdio: 'inherit' });

    // Run
    execSync(`pm2 delete epic-backup-api`, { stdio: 'inherit' });
    execSync(`pm2 start "node dist/main" --name epic-backup-api`, { stdio: 'inherit' });



    // const installScript = path.join(extractDir, `${version}_update.sh`);
    // if (fs.existsSync(installScript)) {
    //   spinner.start(`Running install script: ${installScript}`);
    //   execSync(`bash ${installScript} ${version} ${mysqlRootPassword} ${apiPublicUrl}`, { stdio: 'inherit' });
    // } else {
    //   throw new Error(`Install script not found in ${extractDir}`);
    // }

    config.set('current_eh_version', version);
    spinner.succeed(`Installation of ${version} completed successfully.`);
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
};
