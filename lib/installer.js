import fs from 'fs';
import path from 'path';
import axios from 'axios';
import ora from 'ora';
import * as tar from 'tar';
import { execSync } from 'child_process';
import chalk from 'chalk';
import Conf from 'conf';
import { exit } from 'process';

export const performInstall = async ({ version, mysqlRootPassword, apiPublicUrl, os }) => {
  console.log(`Installing version ${version}...`);
  exit(0);
  const config = new Conf({projectName: 'eh_manager'});
  const spinner = ora('Starting the install process...').start();

  try {
    const url = `http://epiclabs23.com/${version}_ubuntu_${os}.tar.gz`;
    const targetDir = '/epiclabs23/eh/ehm';
    const extractDir = path.join(targetDir, version);

    // Clean up
    spinner.text = `Cleaning up the directory: ${extractDir}`;
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(targetDir, { recursive: true });

    // Download
    spinner.text = `Downloading ${url}...`;
    const downloadPath = path.join(targetDir, `${version}_ubuntu_${os}.tar.gz`);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    console.log('downloadPath: ', downloadPath);
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
    const installScript = path.join(extractDir, `${version}_update.sh`);
    if (fs.existsSync(installScript)) {
      spinner.text = `Running install script: ${installScript}`;
      execSync(`bash ${installScript} ${version} ${mysqlRootPassword} ${apiPublicUrl}`, { stdio: 'inherit' });
    } else {
      throw new Error(`Install script not found in ${extractDir}`);
    }

    config.set('current_eh_version', version);
    spinner.succeed(`Installation of ${version} completed successfully.`);
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
};
