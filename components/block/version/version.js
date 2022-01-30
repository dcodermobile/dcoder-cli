const { blockStatusCheck } = require('../../../middlewares/block')
const { userAuthCheck } = require('../../../middlewares/user')
const versionSvc = require('./versionSvc')
const inquirer = require('inquirer')
const { syncBlockChanges } = require('../block')
const { logError, logSuccess } = require('../../../utils/logging')

module.exports.getVersionList = async (args) => {
  try {
    const blockPath = process.cwd()
    const token = userAuthCheck()
    const blockId = blockStatusCheck(blockPath)
    const blockVersionList = await versionSvc.getBlockVersionList(blockId, token)

    const structData = []
    for (let i = 0; i < blockVersionList.length; i++) {
      structData.push({ Version: blockVersionList[i].version, Changelog: blockVersionList[i].changelog, 'Publish date': new Date(blockVersionList[i].publishedAt).toLocaleString() })
    }

    console.table(structData)
  } catch (err) {
    logError(err)
    logError(new Error('Unable to get version list, please try again in some time.'))
  }
}

module.exports.createVersion = async (args) => {
  try {
    const blockPath = process.cwd()
    const token = userAuthCheck()
    const blockId = blockStatusCheck(blockPath)

    const questions = [
      {
        type: 'input',
        name: 'version',
        message: `Enter version`
      },
      {
        type: 'input',
        name: 'changelog',
        message: `Changelog`
      }
    ]

    const answers = await inquirer.prompt(questions)

    await syncBlockChanges(null, true)
    await versionSvc.createBlockVersion(blockId, answers.version, answers.changelog, token)
    logSuccess('Version created successfully.')
  } catch (err) {
    logError(err)
    logError(new Error('Unable to create version, please try again in some time.'))
  }
}