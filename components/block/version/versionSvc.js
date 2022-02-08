const { BLOCK_API_URL } = require('../../../configs/config')
const axios = require('axios')

module.exports.getBlockVersionList = async (fileId, token) => {
  const versionList = await axios.post(`${BLOCK_API_URL}/block/release`, {
    block_id: fileId,
    is_from_filesystem: true
  }, {
    headers: {
      'x-access-token': token,
      'Content-Type': 'application/json'
    }
  })
  return versionList.data.data
}


module.exports.createBlockVersion = (fileId, version, changelog, token) => {
  return axios.post(`${BLOCK_API_URL}/block/release/create`, {
    version,
    changelog,
    block_id: fileId
  }, {
    headers: {
      'x-access-token': token,
      'Content-Type': 'application/json'
    }
  })
}


module.exports.isValidVersion = (version) => {
  try {
    if (version && typeof version === 'string') {
      const versionArray = version.split('.')
      if (versionArray && versionArray.length === 3) {
        const major = parseInt(versionArray[0])
        const minor = parseInt(versionArray[1])
        const patch = parseInt(versionArray[2])
        return true
      }
    }
    return false
  } catch (err) {
    return false
  }
}
