const colors = require('colors')
const { getConnectedOauthList } = require('../helpers/oAuth')
const { userAuthCheck } = require('../middlewares/user')

module.exports.getMyAuths = async () => {
  try {
    const token = userAuthCheck()
    const myAuthList = await getConnectedOauthList(token)
    const structDatas = []

    for (let i = 0; i < myAuthList.length; i++) {
      structDatas.push({ Name: myAuthList[i].name, 'Creation date': new Date(myAuthList[i].createdAt).toLocaleString() })
    }

    console.table(structDatas);
  } catch (err) {
    if (err.response && err.response.data) {
      console.error(colors.red(err.response.data.message))
    } else {
      console.error(colors.red(err.message))
    }
    console.log(colors.red('Unable to get authentications list, please try again after some time.'))
  }
}