const { getConnectedOauthList } = require('../helpers/oAuth')
const { userAuthCheck } = require('../middlewares/user')
const { logError, logSuccess } = require('../utils/logging')
const chalk = require('chalk')
const pad = require('pad')

module.exports.getMyAuths = async () => {
  try {
    const token = userAuthCheck()
    const myAuthList = await getConnectedOauthList(token)
    const structDatas = []

    logSuccess('My Authentications')
    for (let i = 0; i < myAuthList.length; i++) {
      console.log(pad(chalk.yellow(`${i + 1}`), 10), myAuthList[i].name, chalk.grey(`(${new Date(myAuthList[i].createdAt).toLocaleString()})`))
    }
  } catch (err) {
    logError(err)
    logError(new Error('Unable to get authentications list, please try again after some time.'))
  }
}