import ora from 'ora';
import { execSync } from 'child_process';
import chalk from 'chalk';
import inquirer from 'inquirer';

export const installEpicBackupSystemDependecy = async () => {

    const spinner = ora('Starting the install process...').start();

    try {

        // Install rclone
        const rcloneVersion = execSync('rclone --version').toString().trim();
        if (!rcloneVersion.includes('rclone v')) {
            spinner.text = `Installing rClone...`;
            execSync('curl https://rclone.org/install.sh | sudo bash', { stdio: 'inherit' });
            spinner.succeed(`Installing rClone completed successfully.`);
        }else{
            spinner.succeed(`rClone already installed.`);
        }

        // Run rclone daemon
        const processListJson = execSync(`pm2 jlist`, { stdio: 'pipe' }).toString();
        const processList = JSON.parse(processListJson);
        const epicBackupApiProcess = processList.find(process => process.name === 'rclone-daemon');
        if (epicBackupApiProcess) {
            execSync(`pm2 delete rclone-daemon`, { stdio: 'inherit' });
        }
        execSync(`pm2 start "rclone rcd --rc-user=nahid --rc-pass=SwitchKnif --rc-addr=:5572" --name rclone-daemon`, { stdio: 'inherit' });

        // Install mysqldump
        const shouldInstallMysqldump = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'shouldInstall',
                message: `Install mysqldump?`,
                // default: true,
            },
        ]);
        if (shouldInstallMysqldump.shouldInstall) {
            spinner.text = `Installing mysqldump...`;
            const mysqlInstaller = execSync('sudo apt-get install mysql-client -y', { stdio: 'inherit' });
            spinner.succeed(`Installing mysqldump... completed successfully.`);
        }
        
        // Install mariadb-dump
        const shouldInstallMariadbDump = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'shouldInstall',
                message: `Install mariadb-dump?`,
                // default: true,
            },
        ]);
        if (shouldInstallMariadbDump.shouldInstall) {
            spinner.text = `Installing mariadb-dump...`;
            execSync('sudo apt-get install mariadb-client -y', { stdio: 'inherit' });
            spinner.succeed(`Installing mariadb-dump... completed successfully.`);
        }

        // Install pg_dump
        const shouldInstallPgDump = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'shouldInstall',
                message: `Install pg_dump?`,
                // default: true,
            },
        ]);
        if (shouldInstallPgDump.shouldInstall) {
            spinner.text = `Installing pg_dump...`;
            execSync('apt-get install postgresql-client -y', { stdio: 'inherit' });
            spinner.succeed(`Installing pg_dump... completed successfully.`);
        }

        spinner.succeed(`System dependecy installation completed successfully.`);
    } catch (error) {
        spinner.fail(chalk.red(`Error: ${error.message}`));
        process.exit(1);
    }
};
