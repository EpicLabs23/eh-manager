import { performInstall } from '../lib/installer.js';
import { getInstallVersion, getPromptOsVersion, getMysqlRootPassword, getApiPublicUrl } from '../lib/prompts.js';

export const installCommand = async (options) => {
    const version = options.version ? options.version : await getInstallVersion().then(res => res.version);
    const mysqlRootPassword = options.dbpass || await getMysqlRootPassword().then(res => res.mysqlRootPassword);
    const apiPublicUrl = options.apiurl || await getApiPublicUrl().then(res => res.apiPublicUrl);
    const os = options.os || await getPromptOsVersion().then(res => res.osVersion);
    const answers = {
        version,
        mysqlRootPassword,
        apiPublicUrl,
        os
    };

    await performInstall(answers);
};
