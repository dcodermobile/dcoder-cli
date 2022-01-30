const { blockStatusCheck } = require('../../../middlewares/block')
const { userAuthCheck } = require('../../../middlewares/user')
const runCommandSvc = require('./runCommandSvc')
const inquirer = require('inquirer')
const { syncBlockChanges } = require('../block')
const { sendRunCommandEvent } = require('../../../helpers/block')
const { logError } = require('../../../utils/logging')

module.exports.runBlockRunCommands = async (args) => {
  let connection = null
  try {
    const blockPath = process.cwd()
    const syncRes = await syncBlockChanges(null, true, true)
    if (syncRes.connection) {
      connection = syncRes.connection
    }

    const blockRunCommands = runCommandSvc.getBlockRunCommands(blockPath)
    const choiceList = []
    for (let i = 0; i < blockRunCommands.length; i++) {
      choiceList.push({
        name: blockRunCommands[i],
        type: 'choice',
        value: i + 1
      })
    }

    const { runCommandPosition } = await inquirer.prompt([{ name: 'runCommandPosition', message: 'Select command to run', type: 'list', choices: choiceList }])
    sendRunCommandEvent(connection, runCommandPosition)
  } catch (err) {
    logError(err)
    logError(new Error('Unable to run commands, please try again in some time.'))
  }
}

module.exports.getBlockRunCommands = async (args) => {
  try {
    const blockPath = process.cwd()
    const token = userAuthCheck()
    const blockId = blockStatusCheck(blockPath)

    const runCommands = runCommandSvc.getBlockRunCommands(blockPath)

    console.log('Run Commands')
    console.log('------------------')
    runCommands.forEach(key => {
      console.log(key)
      console.log('------------------')
    })
  } catch (err) {
    logError(err)
    logError(new Error('Unable to list run commands, please try again in some time.'))
  }
}