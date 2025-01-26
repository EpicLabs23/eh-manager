import inquirer from 'inquirer';
import { getUbuntuVersion } from 'ubuntu-version';

export const getNewVersion = async () => {
    return await inquirer.prompt({
        type: 'input',
        name: 'version',
        message: 'Enter New EHM version (e.g., 0.0.3):',
    });
}
export const getCurrentVersion = async () => {
    return await inquirer.prompt({
        type: 'input',
        name: 'version',
        message: 'Enter current EHM version (e.g., 0.0.3):',
    });
}
export const getInstallVersion = async () => {
    return await inquirer.prompt({
        type: 'input',
        name: 'version',
        message: 'Enter the EHM version (e.g., 0.0.3):',
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
        message: 'Enter the EHM API public URL (e.g., http://eh.epiclabs23.com:2326):',
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
