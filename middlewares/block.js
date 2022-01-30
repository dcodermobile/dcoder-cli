const fs = require('fs')
const path = require('path')
const { BLOCK_INFO_FILE_RELATIVE_PATH } = require('../configs/config')

module.exports.blockStatusCheck = (blockPath) => {
  try {
    let blockInfo = fs.readFileSync(path.join(blockPath, BLOCK_INFO_FILE_RELATIVE_PATH), { encoding: 'utf8' })
    if (blockInfo) {
      blockInfo = JSON.parse(blockInfo)
      if (blockInfo && blockInfo.blockId) {
        return blockInfo.blockId
      }
    }
    throw new Error('Block not configured with Dcoder.')
  } catch (err) {
    console.error(err)
    throw new Error('Block not configured with Dcoder.')
  }
}
