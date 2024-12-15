import fs from 'fs';
import path from 'path';
import axios from 'axios';
import ora from 'ora';
import * as tar from 'tar';
import { execSync } from 'child_process';
import chalk from 'chalk';
// import { exit } from 'process';
// import { getPromptOsVersion, getUpdateAnswers } from './prompts.js';
// import Conf from 'conf';
// import dotenv from 'dotenv';

export const performUpdate = async ({ 
  currentVersion,
  newVersion,
  mysqlRootPassword,
  apiPublicUrl,
  os }) => {
  // const config = new Conf({ projectName: 'eh_manager' });
  // const osVersion = await getPromptOsVersion();
  // config.set('current_eh_version', newVersion);
  // exit(0);
  // const current_eh_version = config.get('current_eh_version');
  // console.log(`Updating from ${current_eh_version} to ${newVersion}...`);
  // exit(0);

  try {
    const url = `http://epiclabs23.com/${newVersion}_ubuntu_${os}.tar.gz`;
    const targetDir = '/epiclabs23/eh/ehm';
    const extractDir = path.join(targetDir, newVersion);
    // const current_env_file = path.join(targetDir, currentVersion, '.env');
    //parse the current .env file using dotenv
    // const current_env = dotenv.config({ path: current_env_file });
    // const current_env_vars = current_env.parsed;
    // console.log('current_env_vars: ', current_env_file);
    // console.log('current_env_vars: ', current_env_vars);
    // exit(0);
    // console.log(current_env_vars.MYSQL_ROOT_PASSWORD);
    // const answers = await getUpdateAnswers(current_env_vars);
    // console.log('answers: ', answers);

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

// export const currentVersion = () => {
//   try {
//     const versionFile = path.join(__dirname, '../versions.json');
//     const data = fs.readFileSync(versionFile, 'utf8');
//     const versions = JSON.parse(data);
//     return versions.current;
//   } catch (error) {
//     console.error('Error reading versions.json:', error);
//     exit(1);
//   }
// };