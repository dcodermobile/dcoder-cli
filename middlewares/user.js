const { CRED_FILE_PATH } = require('../configs/config')
const fs = require('fs')

module.exports.userAuthCheck = () => {
  if (fs.existsSync(CRED_FILE_PATH)) {
    let fileData = fs.readFileSync(CRED_FILE_PATH, { encoding: 'utf8' })
    if (fileData) {
      fileData = JSON.parse(fileData)
      if (fileData.token) {
        return Buffer.from(fileData.token, 'base64').toString('ascii')
      }
    }
  }
  throw new Error('User not logged in.')
}