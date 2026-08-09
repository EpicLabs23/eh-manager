import fs from 'fs';
import path from 'path';
import axios from 'axios';
import ora from 'ora';
import * as tar from 'tar';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { checkSystemRequirements } from './ehm-installer.js';

const PUBLIC_RELEASE_REPO = 'EpicLabs23/ecp-ehm-free';

export const performEhmUpdate = async ({
  currentVersion,
  newVersion,
  mysqlRootPassword,
  apiPublicUrl,
  os,
  influxEnabled,
  encryptionKey }) => {

  await checkSystemRequirements(newVersion);

  try {
    const url = `https://github.com/${PUBLIC_RELEASE_REPO}/releases/download/${newVersion}/${newVersion}_ubuntu_${os}.tar.gz`;
    const targetDir = '/epiclabs23/eh/ehm';
    const extractDir = path.join(targetDir, newVersion);

    const spinner = ora('Starting the update process...').start();

    // Clean up
    spinner.text = `Cleaning up the directory: ${extractDir}`;
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(targetDir, { recursive: true });

    // Download
    spinner.text = `Downloading ${url}...`;
    const downloadPath = path.join(targetDir, `${newVersion}_ubuntu_${os}.tar.gz`);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    const writer = fs.createWriteStream(downloadPath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(chalk.green(`Downloading ${url} to ${downloadPath} completed successfully.`));
        resolve();
      });
      writer.on('error', (error) => {
        console.error(chalk.red(`Error: ${error.message}`));
        reject(error);
      });
    });

    // Extract
    spinner.text = `Extracting ${downloadPath} to ${targetDir}...`;
    await tar.x({ file: downloadPath, cwd: targetDir });

    // Run install script
    const installScript = path.join(extractDir, `${newVersion}_update.sh`);
    if (fs.existsSync(installScript)) {
      spinner.text = `Running install script: ${installScript}`;
      execSync(`bash ${installScript} ${newVersion} ${mysqlRootPassword} ${apiPublicUrl} ${influxEnabled} ${encryptionKey}`, { stdio: 'inherit' });
    } else {
      throw new Error(`Install script not found in ${extractDir}`);
    }

    spinner.succeed(`Installation of ${newVersion} completed successfully.`);
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
};
