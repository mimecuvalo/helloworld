'use strict';

/**
 * For general instructions, see: https://www.npmjs.com/package/flightplan
 *
 * To configure, first set the "plan.target" sections below.
 * Then, set: DIRECTORY_NAME appropriately.
 * Then, to run, do:
 *   ssh-add [path-to-your-private-key]
 *   fly prod
 *
 * Also, make sure your user is setup correctly on the remote server. Scenario:
 * 'example' is the user for connecting to the host and 'www-data' is the user
 * under which you want to execute commands with sudo.
 *
 * 1. 'example' has to be in the sudo group:
 * $ groups example
 * example : example sudo
 *
 * 2. 'example' needs to be able to run sudo -u 'www-data' without a password.
 * In order to do this, add the following line to /etc/sudoers via the `visudo` command.
 * (Make sure it's at the bottom of the file.)
 * example ALL=(www-data) NOPASSWD: ALL
 *
 * 3. user 'www-data' needs to have a login shell (e.g. bash, sh, zsh, ...)
 * $ cat /etc/passwd | grep www-data
 * www-data:x:33:33::/var/www-data:/bin/bash           # GOOD
 * www-data:x:33:33::/var/www-data:/usr/sbin/no-login  # BAD
 */

const { exec } = require('child_process');
const fs = require('fs');
const plan = require('flightplan');
const { promisify } = require('util');

plan.target(
  'prod',
  [
    {
      host: 'nite-lite.net',
      username: 'mime',
      agent: process.env.SSH_AUTH_SOCK,
    },
  ],
  {
    user: 'www-data',
  }
);

const DIRECTORY_NAME = 'helloworld';

const time = new Date().toISOString().replace(/\W/g, '-');
const tmpDir = `${DIRECTORY_NAME}-${time}`;
const remoteTmpDir = `/tmp/${tmpDir}/`;

// run commands on localhost
plan.local(async function (local) {
  local.log('Copying files to remote hosts...');

  const gitInfoFile = '../.cra-all-the-things-prod-git-info.json';
  async function createGitInfoFile() {
    const execPromise = promisify(exec);
    const gitRev = (await execPromise('git rev-parse HEAD')).stdout.trim();
    const gitTime = (await execPromise('git log -1 --format=%cd --date=unix')).stdout.trim();
    fs.writeFileSync(gitInfoFile, JSON.stringify({ gitRev, gitTime }));
  }
  createGitInfoFile();

  local.with(`cd ..`, async () => {
    const filesToCopy = local.exec(`git ls-files`, { silent: true });

    // rsync git files to all the target's remote hosts
    local.transfer(filesToCopy, remoteTmpDir);

    // Copy over .gitinfo file.
    local.transfer([gitInfoFile], remoteTmpDir);
  });
});

// run commands on the target's remote hosts
plan.remote(function (remote) {
  const user = plan.runtime.options.user;
  const varTmpDir = `/var/www/${tmpDir}`;
  const destDir = `/var/www/${DIRECTORY_NAME}`;

  remote.log('Moving folder to web root...');
  remote.sudo(`cp -R ${remoteTmpDir} /var/www`, { user });
  remote.rm(`-rf ${remoteTmpDir}`);

  remote.log('Copying .env file over...');
  remote.sudo(`cp ${destDir}/.env ${varTmpDir}/`, { user, failsafe: true });

  // XXX(mime): this is so brittle and ridiculous - i have to figure out
  // how to better use yarn workspaces to make this better.
  remote.sudo(`cd ${varTmpDir}/packages/hello-world-editor && yarn && yarn build`, { user });
  remote.sudo(`cd ${varTmpDir}/packages/social-butterfly && yarn && yarn build`, { user });

  remote.log('Seeing if we can just reuse the previous node_modules folder...');
  const isPackageJSONUnchanged = remote.sudo(`cmp ${destDir}/package.json ${varTmpDir}/package.json`, { user, failsafe: true });

  if (isPackageJSONUnchanged.code === 0 || (isPackageJSONUnchanged.stderr && isPackageJSONUnchanged.stderr.indexOf('cmp: EOF') === 0 /* ignore NOEOL false positive */)) {
    remote.log('package.json is unchanged. Reusing previous node_modules folder...');
    remote.sudo(`mv ${destDir}/node_modules ${varTmpDir}`, { user });
  } else {
    remote.log('package.json has changed. Installing dependencies...');
    remote.sudo(`cd ${varTmpDir}; yarn workspaces focus -A --production`, { user });
  }

  // Copy over sessions.
  remote.sudo(`cp -R ${destDir}/sessions ${varTmpDir}`, { user, failsafe: true });

  remote.log('Building production files...');
  remote.sudo(`cd ${varTmpDir}; NODE_OPTIONS=--max-old-space-size=4096 yarn build`, { user });

  remote.log('Reloading application...');
  remote.sudo(`ln -snf /var/www/resource ${varTmpDir}/resource`, { user });
  remote.sudo(`ln -snf ${varTmpDir} ${destDir}`, { user });

  // TODO(mime); doing `pm2 kill` is less than ideal - but pm2 doesn't know how to switch out symlinked directories :-/
  // This is done here for the sake of keeping all-the-things as zero-config as possible.
  // For a cleaner deploy take a look at this doc: http://pm2.keymetrics.io/docs/tutorials/capistrano-like-deployments
  remote.sudo(`cd ${destDir}; pm2 kill; pm2 stop helloworld`, { user, failsafe: true });
  remote.sudo(`cd ${destDir}; pm2 startOrReload ecosystem.config.js --env production`, { user });
});
