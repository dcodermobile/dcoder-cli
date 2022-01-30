const { BLOCK_RUN_FILE_NAME } = require('../../../configs/config')
const fs = require('fs')
const path = require('path')
const Yaml = require('yaml')

module.exports.getBlockRunCommands = (blockPath) => {
  const runCommands = []
  const runCommandFilePath = path.join(blockPath, BLOCK_RUN_FILE_NAME)
  if (fs.existsSync(runCommandFilePath)) {
    const runFileData = fs.readFileSync(runCommandFilePath, { encoding: 'utf8' })
    if (runFileData) {
      const parsedData = Yaml.parse(runFileData)
      if (parsedData.commands && parsedData.commands.length > 0) {
        parsedData.commands.forEach(cmd => {
          runCommands.push(cmd.run)
        })
      }
    }
  }
  return runCommands
}