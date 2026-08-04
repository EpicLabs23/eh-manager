import axios from 'axios';
import inquirer from 'inquirer';
import { getUbuntuVersion } from 'ubuntu-version';

const PUBLIC_RELEASE_REPO = 'EpicLabs23/ecp-ehm-free';
const EPIC_BACKUP_RELEASE_REPO = 'EpicLabs23/epic-backup-free';

export const getLatestPublishedVersion = async (repo = PUBLIC_RELEASE_REPO) => {
    try {
        const { data } = await axios.get(`https://api.github.com/repos/${repo}/releases/latest`);
        return data.tag_name;
    } catch {
        return undefined;
    }
};

export const getNewVersion = async () => {
    const latestVersion = await getLatestPublishedVersion();
    return await inquirer.prompt({
        type: 'input',
        name: 'version',
        message: 'Enter New EHM version:',
        default: latestVersion,
    });
}
export const getCurrentVersion = async () => {
    return await inquirer.prompt({
        type: 'input',
        name: 'version',
        message: 'Enter current EHM version:',
    });
}
export const getInstallVersion = async () => {
    const latestVersion = await getLatestPublishedVersion();
    return await inquirer.prompt({
        type: 'input',
        name: 'version',
        message: 'Enter the EHM version:',
        default: latestVersion,
    });
}
export const getInstallEpicBackupVersion = async () => {
    const latestVersion = await getLatestPublishedVersion(EPIC_BACKUP_RELEASE_REPO);
    return await inquirer.prompt({
        type: 'input',
        name: 'version',
        message: 'Enter the Epic Backup version:',
        default: latestVersion,
    });
}
export const getNewEpicBackupVersion = async () => {
    const latestVersion = await getLatestPublishedVersion(EPIC_BACKUP_RELEASE_REPO);
    return await inquirer.prompt({
        type: 'input',
        name: 'version',
        message: 'Enter New Epic Backup version:',
        default: latestVersion,
    });
}
export const getCurrentEpicBackupVersion = async () => {
    return await inquirer.prompt({
        type: 'input',
        name: 'version',
        message: 'Enter current Epic Backup version:',
    });
}
export const getMysqlRootPassword = async () => {
    return await inquirer.prompt({
        type: 'input',
        name: 'mysqlRootPassword',
        message: 'Enter the MySQL root password:',
        validate: input => input ? true : 'Password cannot be empty.'
    });
}
export const getApiPublicUrl = async () => {
    return await inquirer.prompt({
        type: 'input',
        name: 'apiPublicUrl',
        message: 'Enter the EHM API public URL (e.g., https://ehm.hosting23.com/api):',
        validate: input => input ? true : 'URL cannot be empty.'
    });
}

export const getUpdateAnswers = async (defaults) => {
    return await inquirer.prompt([
        {
            type: 'input',
            name: 'mysqlRootPassword',
            message: 'Enter the MySQL root password:',
            default: defaults.mysqlRootPassword,
            validate: input => input ? true : 'Password cannot be empty.'
        },
        {
            type: 'input',
            name: 'apiPublicUrl',
            message: 'Enter the EHM API public URL:',
            default: defaults.apiPublicUrl,
            validate: input => input ? true : 'URL cannot be empty.'
        }
    ]);
};

export const getPromptOsVersion = async () => {
    const version = await getUbuntuVersion();

    if (version.length === 0) {
        throw new Error('This OS is not Ubuntu');
    }
    const osVersion = `${version[0]}.${(version[1].toString()).padStart(2, '0')}`;
    return await inquirer.prompt([
        {
            type: 'input',
            name: 'osVersion',
            message: 'Enter the OS version:',
            default: osVersion,
            validate: input => input ? true : 'OS version cannot be empty.'
        }
    ]);
};
