module.exports = {
  _comment: "This is used by pm2 on production.",
  apps : [{
    name   : "helloworld",
    script : "npm run serve:prod"
  }]
}
