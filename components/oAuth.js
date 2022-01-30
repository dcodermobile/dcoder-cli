const { getConnectedOauthList } = require('../helpers/oAuth')
const { userAuthCheck } = require('../middlewares/user')
const { logError } = require('../utils/logging')

module.exports.getMyAuths = async () => {
  try {
    const token = userAuthCheck()
    const myAuthList = await getConnectedOauthList(token)
    const structDatas = []

    for (let i = 0; i < myAuthList.length; i++) {
      structDatas.push({ Name: myAuthList[i].name, 'Creation date': new Date(myAuthList[i].createdAt).toLocaleString() })
    }

    console.table(structDatas)
  } catch (err) {
    logError(err)
    logError(new Error('Unable to get authentications list, please try again after some time.'))
  }
}