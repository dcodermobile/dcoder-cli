const path = require('path')

module.exports = {
  APP_VERSION_CODE: '550',
  BLOCK_FS_RESOURCE_TYPE: 4,
  API_URL: 'https://testapi.dcoder.tech',
  BLOCK_API_URL: 'https://pclb475.dcoder.tech',
  BLOCK_WS_URL: 'wss://pclb475.dcoder.tech',
  BASE_PATH: path.join(process.env.HOME, '.dcoder'),
  CRED_FILE_PATH: path.join(process.env.HOME, '.dcoder', 'account.json'),
  BLOCK_INFO_FILE_PATH: path.join(process.env.HOME, '.dcoder', 'blocks.json'),
  BLOCK_FILE_PATH: path.join(process.cwd(), 'dcoder_block.yml'),
  BLOCK_INFO_FILE_RELATIVE_PATH: '.dcoder/block.json',
  BLOCK_RUN_FILE_NAME: 'dcoder_run.yml',
  BLOCK_FILE_NAME: 'dcoder_block.yml',
  BLOCK_MAIN_FILE_NAME: 'index.js',
  BLOCK_RUN_FILE_TEMPLATE_TEXT: `commands:
  - run: |
      # Write your command here
    default: true
  - run: |
      npm i
      npm i -g @vercel/ncc
      ncc build`,
  BLOCK_FILE_TEMPLATE_TEXT: `fileName: index.js
runFunction: main
auths:
  - name: github
inputs:
  - name: item
    default: Chair
    type: Text
    required: true
    description: Name of any item. like - Chair, Book
  - name: item1
    default: Chair
    type: Text
    required: true
    description: Name of any item. like - Chair, Book
output:
  name: result
  type: Text
  description: Text response returned by block`,
  BLOCK_MAIN_FILE_TEMPLATE_TEXT: `/**
* Write code here, must await the results using async await.
* Do not use promises .then or callback functions.
* Do not use try catch, Dcoder does error handling for you.
*/
const main = async(inputs, auths, context) => {
  console.log('Input provided : '+ inputs.item)
  return inputs.item
}

module.exports.main = main`,
  SYNC_IGNORE_PATH: ['.upm', '.dcoder', '.git', 'node_modules']
}
