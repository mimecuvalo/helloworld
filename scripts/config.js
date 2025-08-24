'use strict';
/* eslint-disable */

const execSync = require('child_process').execSync;
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let name, githubUsername, email;
rl.question('Name: ', (answer) => {
  name = answer;
  rl.question('GitHub username: ', (answer) => {
    githubUsername = answer;
    rl.question('Email: ', (answer) => {
      email = answer;
      rl.close();

      configRepo();
    });
  });
});

function configRepo() {
  name = name.replace(/ /, '\\ ');
  execSync(`grep fullname * -rsiIl --include="*.md" | xargs sed -i '' s/fullname/${name}/g`);
  execSync(`grep githubusername * -rsiIl --include="*.md" | xargs sed -i '' s/githubusername/${githubUsername}/g`);
  execSync(`grep email@gmail.com * -rsiIl --include="*.md" | xargs sed -i '' s/email@gmail.com/${email}/g`);
  execSync(`grep year * -rsiIl --include="*.md" | xargs sed -i '' s/year/${new Date().getFullYear()}/g`);
}
