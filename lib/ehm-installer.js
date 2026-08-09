import fs from 'fs';
import path from 'path';
import axios from 'axios';
import ora from 'ora';
import * as tar from 'tar';
import { execSync } from 'child_process';
import chalk from 'chalk';
import Conf from 'conf';
import semver from 'semver';
import { getUbuntuVersion } from 'ubuntu-version';
import { exit } from 'process';
import os from 'os';

const PUBLIC_RELEASE_REPO = 'EpicLabs23/ecp-ehm-free';

export const performEhmInstall = async ({ version, mysqlRootPassword, apiPublicUrl, os, influxEnabled, encryptionKey }) => {

  await checkSystemRequirements(version);

  const config = new Conf({ projectName: 'eh_manager' });
  const spinner = ora('Starting the install process...').start();

  try {
    const url = `https://github.com/${PUBLIC_RELEASE_REPO}/releases/download/${version}/${version}_ubuntu_${os}.tar.gz`;
    const targetDir = '/epiclabs23/eh/ehm';
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
    const downloadPath = path.join(targetDir, `${version}_ubuntu_${os}.tar.gz`);
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

    // Run install script
    const installScript = path.join(extractDir, `${version}_update.sh`);
    if (fs.existsSync(installScript)) {
      spinner.start(`Running install script: ${installScript}`);
      execSync(`bash ${installScript} ${version} ${mysqlRootPassword} ${apiPublicUrl} ${influxEnabled} ${encryptionKey}`, { stdio: 'inherit' });
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

export const checkSystemRequirements = async (version) => {

  const spinner = ora('Checking system requirements...').start();

  try {
    const requirementsUrl = `https://github.com/${PUBLIC_RELEASE_REPO}/releases/download/${version}/${version}_requirements.json`;
    let requirements;
    try {
      const { data } = await axios.get(requirementsUrl, { responseType: 'json' });
      requirements = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      if (error.response?.status === 404) {
        spinner.warn(chalk.yellowBright(`System requirements file not found for ${version}; skipping requirement checks.`));
        return;
      }
      throw error;
    }

    const cpuCores = os.cpus().length;
    const memory = Math.floor(os.totalmem() / (1024 * 1024 * 1024));

    if (requirements.cpuCores && cpuCores < requirements.cpuCores) {
      spinner.warn(chalk.yellowBright(`CPU Cores: At least ${requirements.cpuCores} CPU cores are recommended`));
    } else {
      spinner.succeed(`CPU Cores: ${cpuCores} CPU cores found`);
    }

    if (requirements.memoryGb && memory < requirements.memoryGb) {
      spinner.warn(chalk.yellowBright(`Memory: At least ${requirements.memoryGb} GB of RAM is recommended`));
    } else {
      spinner.succeed(`Memory: ${memory} GB of RAM found`);
    }

    if (requirements.ubuntuVersion) {
      const ubuntuVersion = await getUbuntuVersion();
      const osVersion = `${ubuntuVersion[0]}.${ubuntuVersion[1]}.${ubuntuVersion[2]}`;
      if (!semver.satisfies(osVersion, requirements.ubuntuVersion)) {
        spinner.fail(chalk.red(`Ubuntu Version: You need Ubuntu matching ${requirements.ubuntuVersion} (found ${osVersion})`));
        process.exit(1);
      } else {
        spinner.succeed(`Ubuntu Version: ${osVersion} found`);
      }
    }

    if (requirements.nodeVersion) {
      const nodeVersion = process.versions.node;
      if (!semver.satisfies(nodeVersion, requirements.nodeVersion)) {
        spinner.fail(chalk.red(`Node Version: You need Node matching ${requirements.nodeVersion} (found ${nodeVersion})`));
        process.exit(1);
      } else {
        spinner.succeed(`Node Version: ${nodeVersion} found`);
      }
    }

    spinner.succeed('System requirements check completed successfully.');
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
};

