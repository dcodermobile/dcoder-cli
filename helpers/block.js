const axios = require('axios')
const { BLOCK_API_URL, BLOCK_WS_URL } = require('../configs/config')
const WebSocketClient = require('websocket').client
const path = require('path')
const fs = require('fs')
const pad = require('pad')
const colors = require('colors')
let WS_CONNECTION_STATE = {
  CONNECTING: 1,
  CONNECTED: 2,
  DISCONNECTED: 3
}

const FormData = require('form-data'); // npm install --save form-data

let wsState = WS_CONNECTION_STATE.DISCONNECTED

module.exports.uploadBlockFile = (blockId, dirPath, localFilePath, token) => {
  const form = new FormData()
  form.append('file', fs.createReadStream(localFilePath))

  const request_config = {
    headers: {
      'x-access-token': token,
      ...form.getHeaders()
    },
    params: {
      project_id: blockId,
      dir_path: dirPath,
      is_from_filesystem: true
    }
  }

  return axios.post(`${BLOCK_API_URL}/file/upload`, form, request_config)
}

module.exports.blockDirOperation = async (blockId, dirPath, operation, token) => {
  const res = await axios.post(`${BLOCK_API_URL}/directory/${operation}`, {
    project_id: blockId,
    dir_path: dirPath,
    is_from_filesystem: true
  }, {
    headers: {
      'x-access-token': token
    }
  })
  return res.data.data
}

module.exports.blockFileOperation = async (blockId, filePath, operation, token) => {
  const res = await axios.post(`${BLOCK_API_URL}/file/${operation}`, {
    project_id: blockId,
    file_path: filePath,
    is_from_filesystem: true
  }, {
    headers: {
      'x-access-token': token
    }
  })
  return res.data.data
}


const saveBlockFile = async (blockId, filePath, filePatch, token) => {
  const res = axios.post(`${BLOCK_API_URL}/file/get`, {
    project_id: blockId,
    file_path: filePath,
    file_patch: filePatch,
    is_from_filesystem: true
  }, {
    headers: {
      'x-access-token': token
    }
  })
  return res.data
}

module.exports.pullChanges = async (blockId, basePath, token) => {
  const dirData = await this.blockDirOperation(blockId, basePath, 'get', token)
  for (let i = 0; i < dirData.length; i++) {
    if (dirData[i].type === 0) {
      const fileData = await this.blockFileOperation(blockId, dirData[i].path, 'get', token)
      fs.writeFileSync(path.join(process.cwd(), dirData[i].path), fileData, { encoding: 'utf8' })
    } else if (dirData[i].type === 1) {
      await this.pullChanges(blockId, dirData[i].path, token)
    }
  }
}

module.exports.pushChanges = async (blockId, basePath, token) => {
  const dirData = await this.blockDirOperation(blockId, basePath, 'get', token)
  let fileList = []
  let dirList = []

  dirData.forEach(d => {
    if (d.type === 0) {
      fileList.push(d.name)
    } else {
      dirList.push(d.name)
    }
  });

  const localDirData = fs.readdirSync(path.join(process.cwd(), basePath))
  for (let i = 0; i < localDirData.length; i++) {
    const stat = fs.statSync(path.join(process.cwd(), basePath, localDirData[i]))
    if (stat.isDirectory()) {
      if (dirList.includes(localDirData[i])) {
        dirList.splice(dirList.indexOf(localDirData[i]))
      } else {
        await this.blockDirOperation(blockId, path.join(basePath, localDirData[i]), 'create', token)
      }

      await this.pushChanges(blockId, path.join(basePath, localDirData[i]), token)
    } else if (stat.isFile()) {
      if (fileList.includes(localDirData[i])) {
        fileList.splice(fileList.indexOf(localDirData[i]))
      }
      await this.uploadBlockFile(blockId, basePath, path.join(process.cwd(), basePath, localDirData[i]), token)
    }
  }

  for (let i = 0; i < fileList.length; i++) {
    await this.blockFileOperation(blockId, path.join(basePath, fileList[i]), 'delete', token)
  }

  for (let i = 0; i < dirList.length; i++) {
    await this.blockDirOperation(blockId, path.join(basePath, dirList[i]), 'delete', token)
  }
}


module.exports.initializeBlock = (projectId, token, options) => {
  return new Promise((resolve, reject) => {
    wsState = WS_CONNECTION_STATE.CONNECTING

    const client = new WebSocketClient()

    client.on('connectFailed', function (error) {
      console.log('Connect Error: ' + error.toString())
    })

    client.on('connect', function (connection) {
      connection.on('error', function (error) {
        connection.close()
        wsState = WS_CONNECTION_STATE.DISCONNECTED
      })
      connection.on('close', function () {
        wsState = WS_CONNECTION_STATE.DISCONNECTED
      })
      connection.on('message', function (message) {
        if (message.type === 'utf8') {
          const data = JSON.parse(message.utf8Data)
          if (data.type === 3 && options && options.verbose) {
            console.log(data.data)
          }
          if (data.type === 9 && data.success) {
            wsState = WS_CONNECTION_STATE.CONNECTED
            resolve(connection)
          }
          if (data.type === 14) {
            connection.sendUTF(JSON.stringify({
              type: 15
            }));
            connection.send(JSON.stringify({
              type: 15
            }))
          }
          if (data.type === 26) {
            console.log('\n')
            console.log('INPUTS')
            console.log('------------------')
            Object.keys(data.inputs).forEach(key => {
              console.log(pad(colors.grey(key), 30), data.inputs[key])
            })
            console.log('\n')
            console.log('OUTPUT')
            console.log('------------------')
            Object.keys(data.output).forEach(key => {
              console.log(pad(colors.grey(key), 30), data.output[key])
            })
            connection.close()
          }
        }
      })
    })

    client.connect(`${BLOCK_WS_URL}/compiler/?token=${token}&id=${projectId}&fs=${true}&type=1x`, 'echo-protocol');
  })
}

module.exports.closeConnection = (connection) => {
  if (connection) {
    connection.close()
  }
}

module.exports.sendRunEvent = (block, inputs, connection) => {
  const data = {
    type: 24,
    block,
    inputs
  }
  connection.send(JSON.stringify(data))
}
