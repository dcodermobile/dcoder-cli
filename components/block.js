const fs = require('fs')
const path = require('path')
const Yaml = require('yaml')
const colors = require('colors')
const inquirer = require('inquirer')
const { machineIdSync } = require('node-machine-id')
const { userAuthCheck } = require('../middlewares/user')
const { blockStatusCheck } = require('../middlewares/block')
const { BLOCK_INFO_FILE_PATH, BLOCK_FILE_PATH } = require('../configs/config')
const { getConnectedOauthList, addTokenToBlock, getAllOAuthApps, getBlockOAuths, unlinkBlockToken, getOAuthUrl } = require('../helpers/oAuth')
const { initializeBlock, closeConnection, pullChanges, pushChanges, sendRunEvent, syncChanges, createBlock, getBlockData, setBlockActiveDevice } = require('../helpers/block')

module.exports.createBlock = async (args) => {
  const blockPath = process.cwd()
  const projectName = path.basename(blockPath)
  const { name } = args
  let connection = null

  try {
    const token = userAuthCheck()

    const body = {
      block_name: name || projectName,
      language_id: 1021,
      source_type: 1,
      project_name: projectName,
      fs_resource_type: 4
    }

    const blockCreateRes = await createBlock(body, token)

    const blockData = {
      block_path: blockPath,
      block_name: name,
      block_id: blockCreateRes.block_id,
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
    console.log(colors.green(blockCreateRes.message))
    console.log(colors.green('Initialising connection...'))
    connection = await initializeBlock(blockData.block_id, machineIdSync(), token)
    console.log(colors.green('Connection established successfully.'))
    console.log(colors.green('Syncing data...'))
    await pullChanges(blockCreateRes.block_id, blockPath, '', token)
    console.log(colors.green('Data synced successfully.'))
  } catch (err) {
    if (err.response && err.response.data) {
      console.error(colors.red(err.response.data.message))
    } else {
      console.error(colors.red(err.message))
    }
    console.log(colors.red('Unable to create block, please try again after some time.'))
  } finally {
    closeConnection(connection)
  }
}

module.exports.syncBlockChanges = async () => {
  const blockPath = process.cwd()
  let connection = null

  try {
    const token = userAuthCheck()
    const blockId = blockStatusCheck(blockPath)
    const blockData = await getBlockData(blockId, token)

    let syncBack = false
    if (blockData && blockData.active_session && blockData.active_session.device_id && blockData.active_session.device_id != machineIdSync()) {
      const { shouldSync } = await inquirer.prompt([{ name: 'shouldSync', message: 'Sync is already active on another device, Do you want to sync data from here and overwrite?', type: 'confirm' }])
      if (shouldSync) {
        await setBlockActiveDevice(blockId, machineIdSync(), token)
      } else {
        return
      }
    } else if (blockData && (!blockData.active_session || !blockData.active_session.device_id) && blockData.last_session && blockData.last_session.device_id !== machineIdSync()) {
      const { shouldSync } = await inquirer.prompt([{ name: 'shouldSync', message: 'Last changes pushed on this project was from another device, Do you want to override those changes with local changes?', type: 'confirm' }])
      if (!shouldSync) {
        return
      }
    }

    console.log(colors.green('Initialising connection...'))
    connection = await initializeBlock(blockId, machineIdSync(), token)
    console.log(colors.green('Connection established successfully.'))
    console.log(colors.green('Syncing changes...'))
    await syncChanges(blockId, blockPath, token, syncBack)
    console.log(colors.green('Changes synced successfully.'))
  } catch (err) {
    if (err.response && err.response.data) {
      console.error(colors.red(err.response.data.message))
    } else {
      console.error(colors.red(err.message))
    }
    console.log(colors.red('Unable to sync changes.'))
  } finally {
    closeConnection(connection)
  }
}

module.exports.runBlock = async (args) => {
  try {
    const blockPath = process.cwd()
    const token = userAuthCheck()
    const blockId = blockStatusCheck(blockPath)
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
    const connection = await initializeBlock(blockId, machineIdSync(), token, args)
    console.log(colors.green('Connection established successfully.'))
    console.log(colors.green('Syncing changes...'))
    await pushChanges(blockId, blockPath, '', token)
    console.log(colors.green('Changes synced successfully.'))
    console.log(colors.green('Running block...'))
    sendRunEvent(parsedBlockData.id, inputs, connection)
  } catch (err) {
    if (err.response && err.response.data) {
      console.error(colors.red(err.response.data.message))
    } else {
      console.error(colors.red(err.message))
    }
    console.log(colors.red('Unable to run block, please try again after some time.'))
  }
}

module.exports.cloneBlock = async (args) => {
  const blockPath = process.cwd()
  const projectName = path.basename(blockPath)
  const { name } = args
  let connection = null

  try {
    let token = userAuthCheck()
    const blockData = await getBlockData(name || projectName, token)

    const blockDataInternal = {
      block_path: blockPath,
      block_name: name || projectName,
      block_id: blockData._id,
    }

    let fileData = []
    try {
      fileData = fs.readFileSync(BLOCK_INFO_FILE_PATH, { encoding: 'utf8' })
      if (fileData) {
        fileData = JSON.parse(fileData)
      }
    } catch (err) { }

    fileData.push(blockDataInternal)
    fs.writeFileSync(BLOCK_INFO_FILE_PATH, JSON.stringify(fileData), { encoding: 'utf8' })
    console.log(colors.green(blockData.message))
    console.log(colors.green('Initialising connection...'))
    connection = await initializeBlock(blockData._id, machineIdSync(), token)
    console.log(colors.green('Connection established successfully.'))
    console.log(colors.green('Syncing data...'))
    await pullChanges(blockData._id, blockPath, '', token)
    console.log(colors.green('Data synced successfully.'))
  } catch (err) {
    if (err.response && err.response.data) {
      console.error(colors.red(err.response.data.message))
    } else {
      console.error(colors.red(err.message))
    }
    console.log(colors.red('Unable to clone block, please try again after some time.'))
  } finally {
    closeConnection(connection)
  }
}

module.exports.addOauth = async (args) => {
  try {
    const choiceList = []
    const blockPath = process.cwd()
    const token = userAuthCheck()
    const blockId = blockStatusCheck(blockPath)

    const authAppList = await getAllOAuthApps(token)
    if (!authAppList || authAppList.length == 0) {
      throw new Error('Unable to fetch list of app authentications, please try again after some time.')
    }

    authAppList.forEach(x => {
      choiceList.push({
        name: x.app_name,
        type: 'choice',
        value: x
      })
    })

    const { oAuthDoc } = await inquirer.prompt([{ name: 'oAuthDoc', message: 'Select authentication', type: 'list', choices: choiceList }])

    const blockYaml = fs.readFileSync(path.join(blockPath, 'dcoder_block.yml'), { encoding: 'utf8' })
    const parsedYamlData = Yaml.parse(blockYaml)


    const connectedOAuthList = await getConnectedOauthList(token, oAuthDoc._id)
    if (connectedOAuthList && connectedOAuthList.length > 0) {
      const connectedAuthChoiceList = []
      for (let i = 0; i < connectedOAuthList.length; i++) {
        connectedAuthChoiceList.push({
          name: `${connectedOAuthList[i].name} ( ${new Date(connectedOAuthList[i].createdAt).toLocaleString()} )`,
          value: connectedOAuthList[i],
          type: 'choice'
        })
      }
      connectedAuthChoiceList.push({
        name: 'Create new',
        value: { name: 'New' },
        type: 'choice'
      })

      const { connectedOAuthDoc } = await inquirer.prompt([{ message: 'Select from connected authentications', name: 'connectedOAuthDoc', type: 'list', choices: connectedAuthChoiceList }])

      if (connectedOAuthDoc.name !== 'New') {
        await addTokenToBlock(blockId, parsedYamlData.id, connectedOAuthDoc._id, token)
        console.log(colors.green('Authentication added successfully.'))
        return
      }
    }

    const oAuthConnectUrl = await getOAuthUrl(blockId, parsedYamlData.id, oAuthDoc._id, token)
    console.log('Open this url in browser to authenticate: ' + oAuthConnectUrl)
    const { authConfirm } = await inquirer.prompt([{ name: 'authConfirm', message: 'Confirm once you finished authenticating', type: 'confirm' }])

    if (authConfirm) {
      const blockOAuths = await getBlockOAuths(blockId, token)
      const connectedOAuth = blockOAuths.find(bl => bl.block_id === parsedYamlData.id && bl.app_id._id === oAuthDoc._id)

      if (connectedOAuth) {
        if (!parsedYamlData.auths) {
          parsedYamlData.auths = []
        }
        parsedYamlData.auths.push({ name: oAuthDoc.app_identifier })
        fs.writeFileSync(path.join(blockPath, 'dcoder_block.yml'), Yaml.stringify(parsedYamlData), { encoding: 'utf8' })
        console.log(colors.green('Authentication added successfully.'))
      } else {
        throw new Error('Unable to detect authentication.')
      }
    }
  } catch (err) {
    if (err.response && err.response.data) {
      console.error(colors.red(err.response.data.message))
    } else {
      console.error(colors.red(err.message))
    }
    console.log(colors.red('Unable to add app authentication, please try again after some time.'))
  }
}

module.exports.unlinkOAuth = async (args) => {
  try {
    const blockPath = process.cwd()
    const token = userAuthCheck()
    const blockId = blockStatusCheck(blockPath)
    const blockOAuthList = await getBlockOAuths(blockId, token)
    if (!blockOAuthList || blockOAuthList.length === 0) {
      throw new Error('No connected authentication found for this block.')
    }

    const connectedAuthChoiceList = []
    for (let i = 0; i < blockOAuthList.length; i++) {
      connectedAuthChoiceList.push({
        name: `${blockOAuthList[i].app_id.app_identifier}`,
        value: blockOAuthList[i],
        type: 'choice'
      })
    }

    const { connectedOAuth } = await inquirer.prompt([{ message: 'Select from connected authentications to unlink', name: 'connectedOAuth', type: 'list', choices: connectedAuthChoiceList }])
    const { block_id, oauth_token_id } = connectedOAuth
    await unlinkBlockToken(blockId, block_id, oauth_token_id, token)
    console.log('OAuth unlinked successfully.')
  } catch (err) {
    if (err.response && err.response.data) {
      console.error(colors.red(err.response.data.message))
    } else {
      console.error(colors.red(err.message))
    }
    console.log(colors.red('Unable to unlink, please try again in some time.'))
  }
}
