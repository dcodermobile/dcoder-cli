const chalk = require('chalk')

module.exports.logError = (err) => {
  if (err.response && err.response.data) {
    console.log(chalk.redBright(err.response.data.message))
  } else {
    console.log(chalk.redBright(err.message))
  }
}

module.exports.logSuccess = (msg) => {
  console.log(chalk.greenBright(msg))
}