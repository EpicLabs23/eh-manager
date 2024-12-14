import { performUpdate } from '../lib/updater.js';

export const updateCommand = async (options) => {
  console.log(`Updating to version ${options.version}...`);
  await performUpdate({
    newVersion: options.version,
    mysqlRootPassword: '', // Prompt user in install logic if needed
    apiPublicUrl: ''
  });
};
