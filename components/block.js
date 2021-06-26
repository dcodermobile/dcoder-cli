const axios = require('axios')
const colors = require('colors')
const { BLOCK_API_URL, CRED_FILE_PATH, BLOCK_INFO_FILE_PATH, BLOCK_FILE_PATH } = require('../configs/config')
const path = require('path')
const fs = require('fs')
const Yaml = require('yaml')
const { initializeBlock, closeConnection, pullChanges, pushChanges, sendRunEvent } = require('../helpers/block')
const inquirer = require('inquirer')

module.exports.createBlock = async (args) => {
  const projectName = path.basename(process.cwd())
  const { name } = args

  try {
    const body = {
      block_name: name || projectName,
      language_id: 1021,
      source_type: 1,
      project_name: projectName,
      fs_resource_type: 4
    }
    let token = null
    try {
      let fileData = fs.readFileSync(CRED_FILE_PATH, { encoding: 'utf8' })
      if (fileData) {
        fileData = JSON.parse(fileData)
        if (fileData.token) {
          token = Buffer.from(fileData.token, 'base64').toString('ascii')
        } else {
          throw new Error('Token not found')
        }
      } else {
        throw new Error('User not logged in.')
      }
    } catch (err) {
      console.log(colors.red('Please login first to create block.'))
      return
    }

    const res = await axios.post(`${BLOCK_API_URL}/block/create`, body, {
      headers: {
        'x-access-token': token,
        'Content-Type': 'application/json'
      }
    })

    const blockData = {
      block_path: process.cwd(),
      block_name: name,
      block_id: res.data.block_id,
    }

    let fileData = []
    try {
      fileData = fs.readFileSync(BLOCK_INFO_FILE_PATH, { encoding: 'utf8' })
      if (fileData) {
        fileData = JSON.parse(fileData)
      }
    } catch (err) { }

    fileData.push(blockData)
    fs.writeFileSync(BLOCK_INFO_FILE_PATH, JSON.stringify(fileData), { encoding: 'utf8' })
    console.log(colors.green(res.data.message))
    console.log(colors.green('Initialising connection...'))
    await initializeBlock(res.data.block_id, token)
    console.log(colors.green('Connection established successfully.'))
    console.log(colors.green('Syncing data...'))
    await pullChanges(res.data.block_id, '', token)
    console.log(colors.green('Data synced successfully.'))
  } catch (err) {
    console.log(err)
    if (err && err.response && err.response.data && err.response.data.message) {
      console.log(colors.red(err.response.data.message))
    } else {
      console.log(colors.red('Unable to create block, please try again after some time.'))
    }
  }
  closeConnection()
}


module.exports.pushBlockChanges = async () => {
  const blockPath = process.cwd()
  let token = null
  let blockId = null

  try {
    let accontInfo = fs.readFileSync(CRED_FILE_PATH, { encoding: 'utf8' })
    if (accontInfo) {
      accontInfo = JSON.parse(accontInfo)
      if (accontInfo.token) {
        token = Buffer.from(accontInfo.token, 'base64').toString('ascii')
      }
    }
  } catch (err) { }

  if (!token) {
    console.log(colors.red('Please login first to publish changes.'))
    return
  }

  try {
    let blockInfo = fs.readFileSync(BLOCK_INFO_FILE_PATH, { encoding: 'utf8' })
    if (blockInfo) {
      blockInfo = JSON.parse(blockInfo)
      const blockObj = blockInfo.find(b => b.block_path === blockPath)
      if (blockObj) {
        blockId = blockObj.block_id
      }
    }
  } catch (err) { }

  if (!blockId) {
    console.log(colors.red('Project not configured with dcoder.'))
    return
  }

  try {
    console.log(colors.green('Initialising connection...'))
    await initializeBlock(blockId, token)
    console.log(colors.green('Connection established successfully.'))
    console.log(colors.green('Syncing changes...'))
    await pushChanges(blockId, '', token)
    console.log(colors.green('Changes synced successfully.'))
  } catch (err) {
    console.error(err)
    console.log(colors.red('Unable to sync changes.'))
  }
  closeConnection()
}

module.exports.runBlock = async (args) => {
  const blockPath = process.cwd()
  let token = null
  let blockId = null
  try {
    let accontInfo = fs.readFileSync(CRED_FILE_PATH, { encoding: 'utf8' })
    if (accontInfo) {
      accontInfo = JSON.parse(accontInfo)
      if (accontInfo.token) {
        token = Buffer.from(accontInfo.token, 'base64').toString('ascii')
      }
    }
  } catch (err) { }

  if (!token) {
    console.log(colors.red('Please login first to publish changes.'))
    return
  }

  try {
    let blockInfo = fs.readFileSync(BLOCK_INFO_FILE_PATH, { encoding: 'utf8' })
    if (blockInfo) {
      blockInfo = JSON.parse(blockInfo)
      const blockObj = blockInfo.find(b => b.block_path === blockPath)
      if (blockObj) {
        blockId = blockObj.block_id
      }
    }
  } catch (err) { }

  if (!blockId) {
    console.log(colors.red('Project not configured with dcoder.'))
    return
  }

  try {
    const blockData = fs.readFileSync(BLOCK_FILE_PATH, { encoding: 'utf8' })
    const parsedBlockData = Yaml.parse(blockData)
    let inputs = []
    if (parsedBlockData && parsedBlockData.inputs && Array.isArray(parsedBlockData.inputs) && parsedBlockData.inputs.length > 0) {
      const questions = []
      parsedBlockData.inputs.forEach(inp => {
        questions.push({
          type: 'input',
          name: inp.name,
          message: `${inp.name} (${inp.description})`,
          default: inp.value
        })
      })

      const answers = await inquirer.prompt(questions)
      inputs = Object.values(answers)
    }
    console.log(colors.green('Initialising connection...'))
    const connection = await initializeBlock(blockId, token, args)
    console.log(colors.green('Connection established successfully.'))
    console.log(colors.green('Syncing changes...'))
    await pushChanges(blockId, '', token)
    console.log(colors.green('Changes synced successfully.'))
    console.log(colors.green('Running block...'))
    sendRunEvent(parsedBlockData.id, inputs, connection)
  } catch (err) {
    console.error(err)
    console.log(colors.red('Unable to run block.'))
  }
}
