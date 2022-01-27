const fs = require('fs')
const { BLOCK_INFO_FILE_PATH } = require('../configs/config')

module.exports.blockStatusCheck = (blockPath) => {
  let blockInfo = fs.readFileSync(BLOCK_INFO_FILE_PATH, { encoding: 'utf8' })
  if (blockInfo) {
    blockInfo = JSON.parse(blockInfo)
    const blockObj = blockInfo.find(b => b.block_path == blockPath)
    if (blockObj) {
      return blockObj.block_id
    }
  }
  throw new Error('Block not configured with Dcoder.')
}
