#!/usr/bin/env node

const execa = require('execa');
const axios = require('axios');
const getPort = require('get-port');
const treeKill = require('tree-kill');
const path = require('path');
const { glob } = require('glob');

process.on('SIGINT', async () => {
  treeKill(process.pid, (error) => {
    if (error) {
      console.error(error);
    } else {
      console.log(chalk.yellow('Force killing...'));
    }
    process.exit();
  });
});

const checkServer = async (appBaseURL, duration = 1000, max = 60 * 10) => {
  return new Promise((resolve, reject) => {
    let count = 0;
    const timer = setInterval(async () => {
      if (count++ > max) {
        clearInterval(timer);
        return reject(new Error('Server start timeout.'));
      }

      // if (!(await checkPort(PORT))) {
      //   return;
      // }

      const url = `${appBaseURL}api/__health_check`;
      // console.log('url', url);

      axios
        .get(url)
        .then((response) => {
          if (response.status === 200) {
            clearInterval(timer);
            resolve(true);
          }
        })
        .catch((error) => {
          console.error('Request error:', error?.response?.data?.error);
        });
    }, duration);
  });
};

const checkUI = async (appBaseURL, duration = 1000, max = 60 * 10) => {
  return new Promise((resolve, reject) => {
    let count = 0;
    const timer = setInterval(async () => {
      if (count++ > max) {
        clearInterval(timer);
        return reject(new Error('UI start timeout.'));
      }

      axios
        .get(`${appBaseURL}__umi/api/bundle-status`)
        .then((response) => {
          if (response.data === 'ok') {
            clearInterval(timer);
            resolve(true);
            return;
          }
          if (response.data.bundleStatus.done) {
            clearInterval(timer);
            resolve(true);
          }
        })
        .catch((error) => {
          console.error('Request error:', error.message);
        });
    }, duration);
  });
};

let IDX = 36,
  HEX = '';
while (IDX--) HEX += IDX.toString(36);

function uid(len) {
  let str = '',
    num = len || 11;
  while (num--) str += HEX[(Math.random() * 36) | 0];
  return str;
}

async function appReady({ appBaseURL }) {
  console.log('check server...');
  await checkServer(appBaseURL);
  console.log('server is ready, check UI...');
  await checkUI(appBaseURL);
  console.log('UI is ready.');
}

const { Command } = require('commander');
const program = new Command();

program
  .name('nocobase-e2e')
  .description('CLI to some JavaScript string utilities')
  .version('1.0');

program.command('test')
  .argument('<project>')
  .option('--app-root [appRoot]')
  .option('--production')
  .action(async (project, options) => {
    require('dotenv').config();
    const { appRoot } = options;
    const DB_SCHEMA = `s_${uid()}`;
    const PROJECT_ROOT = path.resolve(process.cwd(), 'projects', project);
    const backupFiles = await glob('*.nbdata', { cwd: PROJECT_ROOT, root: PROJECT_ROOT });
    if (!backupFiles.length) {
      return;
    }
    const restoreFile = path.resolve(PROJECT_ROOT, backupFiles[0]);
    const cwd = appRoot || process.env.APP_ROOT;
    const port = await getPort();
    const SOCKET_PATH = path.resolve(PROJECT_ROOT, 'playwright', `gateway/${DB_SCHEMA}.sock`);
    const PM2_HOME = path.resolve(PROJECT_ROOT, 'playwright', `.pm2/${DB_SCHEMA}`);
    const APP_BASE_URL = process.env.APP_BASE_URL.replace('${port}', port);
    const APP_ENV = options.production ? 'production' : 'development';
    console.log(`Visit: ${APP_BASE_URL}`);
    await execa('yarn', ['nocobase', 'restore', restoreFile, `--schema=${DB_SCHEMA}`], {
      cwd,
      stdio: 'inherit',
      env: {
        DB_SCHEMA,
        APP_ENV,
        NODE_ENV: APP_ENV,
      },
    });
    execa('yarn', [options.production ? 'start' : 'dev', `--port=${port}`], {
      cwd,
      stdio: 'ignore',
      env: {
        DB_SCHEMA,
        PM2_HOME,
        SOCKET_PATH,
        WATCH_FILE: path.resolve(cwd, `storage/.cache/app-watch/${DB_SCHEMA}.ts`),
        APP_CLIENT_CACHE_DIR: `node_modules/.cache/${DB_SCHEMA}`,
        APP_ENV,
        NODE_ENV: APP_ENV,
      },
    });
    console.log(`Visit: ${APP_BASE_URL}`);
    await appReady({ appBaseURL: APP_BASE_URL });
    await execa('yarn', ['playwright', 'test'], {
      stdio: 'inherit',
      env: {
        PROJECT_ROOT,
        APP_BASE_URL,
      },
    });
    process.exit();
  });

program.parseAsync();
