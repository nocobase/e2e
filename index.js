#!/usr/bin/env node

const execa = require('execa');
const axios = require('axios');
const getPort = require('get-port');
const treeKill = require('tree-kill');
const path = require('path');
const { glob } = require('glob');
const fs = require('fs-extra');

require('dotenv').config();

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

async function getProjectConfig(projectRoot) {
  try {
    return await fs.readJson(path.resolve(projectRoot, 'config.json'));
  } catch (error) {
    
    return {};
  }
}

const { Command } = require('commander');
const program = new Command();

program
  .name('nocobase-e2e')
  .description('CLI to some JavaScript string utilities')
  .version('1.0');

program.command('postinstall').action(async () => {
  if (await fs.exists('.env')) {
    return;
  }

  const data = await fs.readFile('.env.example');
  await fs.writeFile('.env', data);
});

program.command('install')
  .action(async () => {
    await execa('yarn', ['playwright', 'install']);
    await execa('yarn', ['nocobase', 'pkg', 'download-pro'], {
      cwd: process.env.APP_ROOT,
      stdio: 'inherit',
      env: {
        NOCOBASE_PKG_URL: process.env.NOCOBASE_PKG_URL || 'https://pkg.nocobase.com/',
        NOCOBASE_PKG_USERNAME: process.env.NOCOBASE_PKG_USERNAME,
        NOCOBASE_PKG_PASSWORD: process.env.NOCOBASE_PKG_PASSWORD,
      },
    });
  });

program.command('test')
  .argument('<project>')
  .option('--app-root [appRoot]')
  .option('--ui')
  .option('--production')
  .option('--development')
  .action(async (project, options) => {
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
    const APP_BASE_URL = process.env.APP_BASE_URL.replace('{{port}}', port);
    let APP_ENV = process.env.APP_ENV || 'development';
    if (options.production) {
      APP_ENV = 'production';
    }
    if (options.development) {
      APP_ENV = 'development';
    }
    console.log(`Visit: ${APP_BASE_URL}`);
    const config = await getProjectConfig();
    const dialect = config?.env?.DB_DIALECT || 'postgres';
    const envs = {};
    const keys = ['DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD', 'DB_UNDERSCORED'];
    for (const key of keys) {
      const value = process.env[`${dialect.toUpperCase()}_${key}`];
      if (value) {
        envs[key] = value;
      }
    }
    await execa('yarn', ['nocobase', 'restore', restoreFile, `--schema=${DB_SCHEMA}`], {
      cwd,
      stdio: 'inherit',
      env: {
        DB_DIALECT: dialect,
        DB_SCHEMA,
        APP_ENV,
        NODE_ENV: APP_ENV,
        ...envs,
        ...config.env,
      },
    });
    execa('yarn', [APP_ENV === 'production' ? 'start' : 'dev', `--port=${port}`], {
      cwd,
      stdio: 'ignore',
      env: {
        DB_DIALECT: dialect,
        DB_SCHEMA,
        PM2_HOME,
        SOCKET_PATH,
        WATCH_FILE: path.resolve(cwd, `storage/.cache/app-watch/${DB_SCHEMA}.ts`),
        APP_CLIENT_CACHE_DIR: `node_modules/.cache/${DB_SCHEMA}`,
        APP_ENV,
        NODE_ENV: APP_ENV,
        ...envs,
        ...config.env,
      },
    });
    console.log(`Visit: ${APP_BASE_URL}`);
    await appReady({ appBaseURL: APP_BASE_URL });
    const args = ['playwright', 'test'];

    const configFile = path.resolve(PROJECT_ROOT, 'playwright.config.ts');
    const exists = await fs.exists(configFile);

    if (exists) {
      args.push(`--config=${configFile}`);
    }

    if (options.ui) {
      args.push('--ui');
    }

    const AUTH_FILE_PATH = path.resolve(PROJECT_ROOT, `playwright/.auth/user-${DB_SCHEMA}.json`);

    await execa('yarn', args, {
      stdio: 'inherit',
      env: {
        PROJECT_ROOT,
        APP_BASE_URL,
        AUTH_FILE_PATH,
      },
    });
    process.exit();
  });

program.parseAsync();
