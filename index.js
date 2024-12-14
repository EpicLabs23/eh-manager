#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import axios from 'axios';
import * as tar from 'tar';

const program = new Command();

const promptUser = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'newVersion',
      message: 'Enter the new EHM version (e.g., v0.0.3):',
      validate: input => input ? true : 'Version cannot be empty.'
    },
    {
      type: 'password',
      name: 'mysqlRootPassword',
      message: 'Enter the MySQL root password:',
      validate: input => input ? true : 'Password cannot be empty.'
    },
    {
      type: 'input',
      name: 'apiPublicUrl',
      message: 'Enter the EHM API public URL (e.g., http://eh.epiclabs23.com:2326):',
      validate: input => input ? true : 'URL cannot be empty.'
    }
  ]);
  return answers;
};

const performUpdate = async ({ newVersion, mysqlRootPassword, apiPublicUrl }) => {
  const spinner = ora('Starting the update process...').start();

  try {
    const url = `http://epiclabs23.com/${newVersion}_ubuntu_22.04.tar.gz`;
    const targetDir = '/epiclabs23/eh/ehm';
    const extractDir = path.join(targetDir, newVersion);
    const apiDir = path.join(extractDir, 'ehm-api');

    // Clean up any existing directory
    spinner.text = `Cleaning up the directory: ${extractDir}`;
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(targetDir, { recursive: true });

    // Download the file
    spinner.text = `Downloading ${url}...`;
    const downloadPath = path.join(targetDir, `${newVersion}_ubuntu_22.04.tar.gz`);
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });
    const writer = fs.createWriteStream(downloadPath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Extract the file
    spinner.text = `Extracting ${downloadPath} to ${targetDir}...`;
    await tar.x({
      file: downloadPath,
      cwd: targetDir,
    });

    // Run the install script
    const installScript = path.join(extractDir, `${newVersion}_update.sh`);
    if (fs.existsSync(installScript)) {
      spinner.text = `Running install script: ${installScript}`;
      execSync(`bash ${installScript} ${newVersion} ${mysqlRootPassword} ${apiPublicUrl}`, { stdio: 'inherit' });
    } else {
      throw new Error(`Install script not found in ${extractDir}`);
    }

    spinner.succeed(`Installation of ${newVersion} completed successfully.`);
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
};

program
  .name('ehm-update')
  .description('Interactive updater for EHM')
  .action(async () => {
    console.log(chalk.blue.bold('EHM Update Script'));
    const answers = await promptUser();
    await performUpdate(answers);
  });

program.parse(process.argv);
