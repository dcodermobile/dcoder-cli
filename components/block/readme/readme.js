const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const { syncBlockChanges } = require('../block')
const { getReadmeText } = require('./readmeSvc')
const { getBlockData } = require('../../../helpers/block')
const { logError, logSuccess } = require('../../../utils/logging')
const { userAuthCheck } = require('../../../middlewares/user')
const { blockStatusCheck } = require('../../../middlewares/block')

module.exports.generateBlockReadMe = async (args) => {
  try {
    const blockPath = process.cwd()
    await syncBlockChanges(null, true, false)
    const token = userAuthCheck()
    const blockId = blockStatusCheck(blockPath)

    const readMeFilePath = path.join(blockPath, 'README.md')
    let shouldCreate = true
    if (fs.existsSync(readMeFilePath)) {
      const userRes = await inquirer.prompt([{ name: 'shouldCreate', message: 'There already exists a readme file, running this will overwrite the existing file. Do you want to proceed?', type: 'confirm' }])
      shouldCreate = userRes.shouldCreate
    }

    if (shouldCreate) {
      const blockData = await getBlockData(blockId, null, null, token)
      const blockYaml = fs.readFileSync(path.join(blockPath, 'dcoder_block.yml'), { encoding: 'utf8' })
      const readMeText = getReadmeText(blockYaml, blockId, blockData.title || blockData.file, blockData.description)
      fs.writeFileSync(readMeFilePath, readMeText, { encoding: 'utf8' })
      logSuccess('Readme file generated successfully.')
    }
  } catch (err) {
    logError(err)
    logError(new Error('Unable to generate readme, please try again in some time.'))
  }
}
