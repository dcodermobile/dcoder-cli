const { API_URL } = require('../configs/config')
const axios = require('axios')

module.exports.getConnectedOauthList = async (token, appId) => {
  let page = 1
  let pageCount = 1
  let connectedOAuthList = []

  while (page <= pageCount) {
    const userAuths = await axios.post(`${API_URL}/oauth/myauths`, {
      page: 1,
      ...(appId && { app_id: appId })
    }, {
      headers: {
        'x-access-token': token,
        'Content-Type': 'application/json'
      }
    })
    connectedOAuthList = connectedOAuthList.concat(userAuths.data.data)
    pageCount = userAuths.data.pages
    page++
  }
  return connectedOAuthList
}

module.exports.getOAuthUrl = async (fileId, blockId, appId, token) => {
  const authUrlRes = await axios.post(`${API_URL}/oauth/getauthurl`, {
    file_id: fileId,
    block_id: blockId,
    app_id: appId
  }, {
    headers: {
      'x-access-token': token,
      'Content-Type': 'application/json'
    }
  })

  if (authUrlRes && authUrlRes.data && authUrlRes.data.url) {
    return authUrlRes.data.url
  }
  throw new Error('Unable to add app authentication, please try again after some time.')
}

module.exports.addTokenToBlock = (fileId, blockId, oauthTokenId, token) => {
  return axios.post(`${API_URL}/oauth/addtoken`, {
    file_id: fileId,
    block_id: blockId,
    oauth_token_id: oauthTokenId
  }, {
    headers: {
      'x-access-token': token,
      'Content-Type': 'application/json'
    }
  })
}

module.exports.unlinkBlockToken = (fileId, blockId, oauthTokenId, token) => {
  return axios.post(`${API_URL}/oauth/removetokenfromblock`, {
    file_id: fileId,
    block_id: blockId,
    oauth_token_id: oauthTokenId
  }, {
    headers: {
      'x-access-token': token,
      'Content-Type': 'application/json'
    }
  })
}

module.exports.getBlockOAuths = async (fileId, token) => {
  const blockAuths = await axios.post(`${API_URL}/oauth/getblocksauths`, {
    file_id: fileId
  }, {
    headers: {
      'x-access-token': token,
      'Content-Type': 'application/json'
    }
  })
  return blockAuths.data
}

module.exports.getAllOAuthApps = async (token, appIdentifiers) => {
  let page = 1
  let pageCount = 1
  let authAppList = []
  while (page <= pageCount) {
    const authAppRes = await axios.post(`${API_URL}/oauth/getalloauthapps`, {
      page,
      ...(appIdentifiers && appIdentifiers.length > 0 && { app_identifiers: appIdentifiers })
    }, {
      headers: {
        'x-access-token': token,
        'Content-Type': 'application/json'
      }
    })
    authAppList = authAppList.concat(authAppRes.data.data)
    pageCount = authAppRes.data.pages
    page++
  }
  return authAppList
}


module.exports.getUserOAuths = async () => {

}