import { performInstall } from '../lib/installer.js';
import { getPromptAnswers, getInstallVersion, getPromptOsVersion, getMysqlRootPassword, getApiPublicUrl } from '../lib/prompts.js';
import { exit } from 'process';

export const installCommand = async (options) => {
    // const version = await getInstallVersion().then(res => res.version);
    const version = options.version ? options.version : await getInstallVersion().then(res => res.version);
    const mysqlRootPassword = options.password || await getMysqlRootPassword().then(res => res.mysqlRootPassword);
    const apiPublicUrl = options.url || await getApiPublicUrl().then(res => res.apiPublicUrl);
    const os = options.os || await getPromptOsVersion().then(res => res.osVersion);
    const answers = {
        version,
        mysqlRootPassword,
        apiPublicUrl,
        os
    };

    // console.log(`Installing version ${version}...`);
    // exit(0);
    await performInstall(answers);
};
