import { performEhmUpdate } from '../lib/ehm-updater.js';
import Conf from 'conf';
import dotenv from 'dotenv';
import path from 'path';
import { getNewVersion, getCurrentVersion, getPromptOsVersion, getMysqlRootPassword, getApiPublicUrl, getInfluxEnabled } from '../lib/prompts.js';

export const updateEhmCommand = async (options) => {
  const config = new Conf({ projectName: 'eh_manager' });
  const targetDir = '/epiclabs23/eh/ehm';
  const current_eh_version = config.get('current_eh_version');

  const currentVersion = options.currentversion || current_eh_version || await getCurrentVersion().then(res => res.version);
  // Read current env file
  const current_env_file = path.join(targetDir, currentVersion, 'ehm-api', '.env');
  const current_env = dotenv.config({ path: current_env_file });
  const current_env_vars = current_env.parsed;

  const newVersion = options.newversion || await getNewVersion().then(res => res.version);
  const mysqlRootPassword = options.dbpass || current_env_vars.MYSQL_ROOT_PASSWORD || await getMysqlRootPassword().then(res => res.mysqlRootPassword);
  const apiPublicUrl = options.apiurl || current_env_vars.EHM_API_PUBLIC_URL || await getApiPublicUrl().then(res => res.apiPublicUrl);
  const os = options.os || await getPromptOsVersion().then(res => res.osVersion);
  const influxEnabled = options.influx !== undefined
    ? options.influx === 'true'
    : await getInfluxEnabled(current_env_vars.INFLUX_METRICS_ENABLED === 'true').then(res => res.influxEnabled);
  // Carried forward as-is (never prompted/regenerated) — secrets encrypted with the
  // old key would become undecryptable if it changed on update.
  const encryptionKey = current_env_vars.EHM_ENCRYPTION_KEY || '';
  // Carried forward as-is — the 'influxdb' container only allows one admin
  // token ("_admin") to exist, so re-creating it on every update 409s once
  // it's already been created.
  const influxToken = current_env_vars.INFLUXDB_TOKEN || '';

  const answers = {
    currentVersion,
    newVersion,
    mysqlRootPassword,
    apiPublicUrl,
    os,
    influxEnabled,
    encryptionKey,
    influxToken
  };

  await performEhmUpdate(answers);
};
