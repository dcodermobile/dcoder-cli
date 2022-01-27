const path = require('path')

module.exports = {
  API_URL: 'https://testapi.dcoder.tech',
  BLOCK_API_URL: 'https://pclb475.dcoder.tech',
  BLOCK_WS_URL: 'wss://pclb475.dcoder.tech',
  BASE_PATH: path.join(process.env.HOME, '.dcoder'),
  CRED_FILE_PATH: path.join(process.env.HOME, '.dcoder', 'account.json'),
  BLOCK_INFO_FILE_PATH: path.join(process.env.HOME, '.dcoder', 'blocks.json'),
  BLOCK_FILE_PATH: path.join(process.cwd(), 'dcoder_block.yml'),
  SYNC_IGNORE_PATH: ['dist', 'node_modules']
}
