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
    let version = ''
    let changelog = ''

    if (args && Object.keys(args).length > 0) {
      if (args.version) {
        version = args.version
      }
      if (args.changelog) {
        changelog = args.changelog
      }

      if (!versionSvc.isValidVersion(version)) {
        logError(new Error('Invalid version provided.'))
        return
      }
    } else {
      console.log('Enter version number in MAJOR.MINOR.PATCH Format, increment the:\n\nMAJOR version when you make incompatible API changes,\nMINOR version when you add functionality in a backwards compatible manner, and\nPATCH version when you make backwards compatible bug fixes.\n Check https://semver.org/ for more details.')

      const versionRes = await inquirer.prompt({
        type: 'input',
        name: 'version',
        message: `Enter version`
      })

      version = versionRes.version

      if (!versionSvc.isValidVersion(version)) {
        logError(new Error('Invalid version provided.'))
        return
      }

      const changelogRes = await inquirer.prompt({
        type: 'input',
        name: 'changelog',
        message: `Changelog`
      })
      changelog = changelogRes.changelog
    }

    if (!version || !changelog) {
      logError(new Error('Version or changelog can not be left empty.'))
      return
    }

    await syncBlockChanges(null, true)
    await versionSvc.createBlockVersion(blockId, version, changelog, token)
    logSuccess('Version created successfully.')
  } catch (err) {
    logError(err)
    logError(new Error('Unable to create version, please try again in some time.'))
  }
}