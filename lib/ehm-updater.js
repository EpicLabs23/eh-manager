import fs from 'fs';
import path from 'path';
import axios from 'axios';
import ora from 'ora';
import * as tar from 'tar';
import { execSync } from 'child_process';
import chalk from 'chalk';

export const performEhmUpdate = async ({ 
  currentVersion,
  newVersion,
  mysqlRootPassword,
  apiurl,
  os }) => {

  try {
    const url = `http://release.epiclabs23.com/${newVersion}_ubuntu_${os}.tar.gz`;
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
    const downloadPath = path.join(targetDir, `${newVersion}_ubuntu_22.04.tar.gz`);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    const writer = fs.createWriteStream(downloadPath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Extract
    spinner.text = `Extracting ${downloadPath} to ${targetDir}...`;
    await tar.x({ file: downloadPath, cwd: targetDir });

    // Run install script
    const installScript = path.join(extractDir, `${newVersion}_update.sh`);
    if (fs.existsSync(installScript)) {
      spinner.text = `Running install script: ${installScript}`;
      execSync(`bash ${installScript} ${newVersion} ${mysqlRootPassword} ${apiurl}`, { stdio: 'inherit' });
    } else {
      throw new Error(`Install script not found in ${extractDir}`);
    }

    spinner.succeed(`Installation of ${newVersion} completed successfully.`);
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
};
