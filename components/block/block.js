const fs = require('fs')
const path = require('path')
const Yaml = require('yaml')
const inquirer = require('inquirer')
const { logError, logSuccess } = require('../../utils/logging')
const { machineIdSync } = require('node-machine-id')
const { userAuthCheck } = require('../../middlewares/user')
const { blockStatusCheck } = require('../../middlewares/block')
const { BLOCK_INFO_FILE_PATH, BLOCK_FILE_PATH, BLOCK_INFO_FILE_RELATIVE_PATH, BLOCK_RUN_FILE_NAME, BLOCK_RUN_FILE_TEMPLATE_TEXT, BLOCK_FILE_NAME, BLOCK_FILE_TEMPLATE_TEXT, BLOCK_MAIN_FILE_TEMPLATE_TEXT, BLOCK_MAIN_FILE_NAME } = require('../../configs/config')
const { getConnectedOauthList, addTokenToBlock, getAllOAuthApps, getBlockOAuths, unlinkBlockToken, getOAuthUrl } = require('../../helpers/oAuth')
const { initializeBlock, closeConnection, pullChanges, pushChanges, sendRunEvent, syncChanges, createBlock, getBlockData, setBlockActiveDevice, publishBlock, updateBlockMetaData, getExistingBlockList } = require('../../helpers/block')
const chalk = require('chalk')

module.exports.createBlock = async (args) => {
  const blockPath = process.cwd()
  const projectName = path.basename(blockPath)
  const { name } = args
  let connection = null

  try {
    const token = userAuthCheck()

    try {
      const blockId = blockStatusCheck(blockPath)
      if (blockId) {
        logError(new Error('Block already intialised with dcoder.'))
        return
      }
    } catch (err) { }

    const body = {
      block_name: name || projectName,
      language_id: 1021,
      source_type: 1,
      project_name: projectName,
      fs_resource_type: 4
    }

    const blockCreateRes = await createBlock(body, token)

    const blockData = {
      blockId: blockCreateRes.block_id,
    }
    const blockDirList = fs.readdirSync(blockPath)

    let shouldPull = true
    if (blockDirList && blockDirList.length > 0) {
      shouldPull = false
      try {
        if (!fs.existsSync(path.join(blockPath, BLOCK_RUN_FILE_NAME))) {
          fs.writeFileSync(path.join(blockPath, BLOCK_RUN_FILE_NAME), BLOCK_RUN_FILE_TEMPLATE_TEXT, { encoding: 'utf8' })
        }
      } catch (err) { }
      try {
        if (!fs.existsSync(path.join(blockPath, BLOCK_FILE_NAME))) {
          fs.writeFileSync(path.join(blockPath, BLOCK_FILE_NAME), `id: ${body.block_name.toUpperCase()}\n` + BLOCK_FILE_TEMPLATE_TEXT, { encoding: 'utf8' })
        }
      } catch (err) { }
      try {
        const blockMainFilePath = path.join(blockPath, BLOCK_MAIN_FILE_NAME)
        if (fs.existsSync(blockMainFilePath)) {
          const mainFileText = fs.readFileSync(blockMainFilePath, { encoding: 'utf8' })
          if (!mainFileText.match(/module\.exports\.main/)) {
            fs.appendFileSync(blockMainFilePath, '\n' + BLOCK_MAIN_FILE_TEMPLATE_TEXT, { encoding: 'utf8' })
          }
        } else {
          fs.writeFileSync(blockMainFilePath, BLOCK_MAIN_FILE_TEMPLATE_TEXT, { encoding: 'utf8' })
        }
      } catch (err) { }
    }

    const blockInfoFilePath = path.join(blockPath, BLOCK_INFO_FILE_RELATIVE_PATH)
    fs.mkdirSync(path.dirname(BLOCK_INFO_FILE_RELATIVE_PATH), { recursive: true })
    fs.writeFileSync(blockInfoFilePath, JSON.stringify(blockData), { encoding: 'utf8' })

    logSuccess(blockCreateRes.message)
    console.log(`\nPlease make sure that your index.js file contains below function\n\n`)
    console.log(BLOCK_MAIN_FILE_TEMPLATE_TEXT)
    logSuccess('\nInitialising connection...')
    connection = await initializeBlock(blockData.blockId, blockPath, machineIdSync(), token)
    logSuccess('Connection established successfully.')
    logSuccess('Syncing data...')
    if (shouldPull) {
      await pullChanges(blockCreateRes.block_id, blockPath, '', token)
    } else {
      await pushChanges(blockCreateRes.block_id, blockPath, '', token)
    }
    logSuccess('Data synced successfully.')
  } catch (err) {
    logError(err)
    logError(new Error('Unable to create block, please try again after some time.'))
  } finally {
    closeConnection(connection)
  }
}

module.exports.publishUserBlock = async (args) => {
  try {
    const blockPath = process.cwd()
    const token = userAuthCheck()
    const blockId = blockStatusCheck(blockPath)
    const blockData = await getBlockData(blockId, null, null, token)
    const blockPublishData = {
      title: blockData.description,
      description: blockData.description,
      tags: blockData.tags,
      icon_url: blockData.icon_url
    }

    if (args && Object.keys(args).length > 0) {
      if (args.title) {
        blockPublishData.title = args.title
      }
      if (args.description) {
        blockPublishData.description = args.description
      }

      if (args.tags) {
        blockPublishData.tags = args.tags.split(',')
      }

      if (args.iconUrl) {
        blockPublishData.icon_url = args.iconUrl
      }
    } else {
      const questions = [
        {
          type: 'input',
          name: 'title',
          message: `Enter block title`,
          default: blockData.title
        },
        {
          type: 'input',
          name: 'description',
          message: `Enter block description`,
          default: blockData.description
        },
        {
          type: 'input',
          name: 'tags',
          message: `Enter block tags(comma seperated)`,
          ...(blockData.tags && blockData.tags.length > 0 && { default: blockData.tags.join(',') })
        },
        {
          type: 'input',
          name: 'iconUrl',
          message: `Enter block icon url`,
          ...(blockData.icon_url && { default: blockData.icon_url })
        }
      ]

      const answers = await inquirer.prompt(questions)
      blockPublishData.title = answers.title
      blockPublishData.description = answers.description
      blockPublishData.tags = answers.tags.split(',')
      blockPublishData.icon_url = answers.iconUrl
    }

    if (!blockPublishData.title || !blockPublishData.description || !blockPublishData.tags || blockPublishData.tags.length == 0) {
      throw new Error('Title, description or tags can not be left empty.')
    }

    await this.syncBlockChanges(null, true)
    const publishRes = await publishBlock(blockId, answers.title, answers.description, answers.tags.split(','), answers.iconUrl, token)
    logSuccess(publishRes.message || 'Block submitted for publish review.')
  } catch (err) {
    logError(err)
    logError(new Error('Unable to publish, please try again in some time.'))
  }
}

module.exports.updateBlockInfo = async (args) => {
  try {
    const blockPath = process.cwd()
    const token = userAuthCheck()
    const blockId = blockStatusCheck(blockPath)
    const blockData = await getBlockData(blockId, null, null, token)

    const updateData = {}

    if (args && Object.keys(args).length > 0) {
      if (args.title) {
        updateData.title = args.title
      }
      if (args.description) {
        updateData.description = args.description
      }
      if (args.tags) {
        updateData.tags = args.tags.split(',')
      }

      if (args.iconUrl) {
        updateData.icon_url = args.iconUrl
      }

      if (args.autoInstallPackage) {
        if (args.autoInstallPackage === 'true') {
          updateData.auto_install_package = true
        } else if (args.autoInstallPackage === 'false') {
          updateData.auto_install_package = false
        }
      }
    } else {
      const questions = [
        {
          type: 'input',
          name: 'title',
          message: `Enter block title`,
          default: blockData.title
        },
        {
          type: 'input',
          name: 'description',
          message: `Enter block description`,
          default: blockData.description
        },
        {
          type: 'input',
          name: 'tags',
          message: `Enter block tags(comma seperated)`,
          ...(blockData.tags && blockData.tags.length > 0 && { default: blockData.tags.join(',') })
        },
        {
          type: 'input',
          name: 'icon_url',
          message: `Enter block icon url`,
          ...(blockData.icon_url && { default: blockData.icon_url })
        },
        {
          type: 'confirm',
          name: 'auto_install_package',
          message: `Should auto install package on run?`,
          ...('auto_install_package' in blockData && { default: blockData.auto_install_package })
        }
      ]

      const answers = await inquirer.prompt(questions)

      Object.keys(answers).forEach(key => {
        if (!answers[key] && answers[key] !== false) {
          delete answers[key]
        }
      })

      if (answers.tags) {
        answers.tags = answers.tags.split(',')
      }
      updateData = answers
    }

    await updateBlockMetaData(blockId, answers, token)
    logSuccess('Block info updated successfully.')
  } catch (err) {
    logError(err)
    logError(new Error('Unable to publish, please try again in some time.'))
  }
}

module.exports.syncBlockChanges = async (args, errorRethrow, preserveSocketConnection) => {
  const blockPath = process.cwd()
  let connection = null

  try {
    const token = userAuthCheck()
    const blockId = blockStatusCheck(blockPath)
    const blockData = await getBlockData(blockId, null, null, token)
    const currentDeviceId = machineIdSync()

    if (!blockData) {
      logError(new Error('Block not connect with dcoder.'))
      return
    }

    let activeDeviceId = currentDeviceId
    if (blockData.active_session && blockData.active_session.device_id && blockData.active_session.device_id != currentDeviceId) {
      activeDeviceId = blockData.active_session.device_id
    } else if ((!blockData.active_session || !blockData.active_session.device_id) && blockData.last_session && blockData.last_session.device_id !== currentDeviceId) {
      activeDeviceId = blockData.active_session.device_id
    }

    let syncDeviceId = currentDeviceId
    if (activeDeviceId !== currentDeviceId) {
      const choiceList = [
        {
          type: 'choice',
          name: 'Current device',
          value: currentDeviceId
        },
        {
          type: 'choice',
          name: 'Other device',
          value: activeDeviceId
        }
      ]

      const userRes = await inquirer.prompt([{ name: 'syncDeviceId', message: 'Looks like there are some changes as sync was active on another device, Do you want to accept changes of that device or current device?', type: 'list', choices: choiceList }])
      syncDeviceId = userRes.syncDeviceId
    }

    logSuccess('Initialising connection...')
    connection = await initializeBlock(blockId, blockPath, currentDeviceId, token)
    await setBlockActiveDevice(blockId, currentDeviceId, token)
    logSuccess('Connection established successfully.')
    logSuccess('Syncing changes...')

    if (syncDeviceId === currentDeviceId) {
      await pushChanges(blockId, blockPath, '', token)
    } else {
      await pullChanges(blockId, blockPath, '', token, false)
    }
    logSuccess('Changes synced successfully.')
    if (preserveSocketConnection) {
      return {
        connection
      }
    }
    closeConnection(connection)
  } catch (err) {
    closeConnection(connection)
    if (errorRethrow) {
      throw err
    }
    logError(err)
    logError(new Error('Unable to sync changes.'))
  }
}

module.exports.runBlock = async (args) => {
  try {
    const { connection } = await this.syncBlockChanges(null, true, true)
    logSuccess('Running block...')

    const blockData = fs.readFileSync(BLOCK_FILE_PATH, { encoding: 'utf8' })
    const parsedBlockData = Yaml.parse(blockData)
    let inputs = []
    if (parsedBlockData && parsedBlockData.inputs && Array.isArray(parsedBlockData.inputs) && parsedBlockData.inputs.length > 0) {
      const questions = []
      parsedBlockData.inputs.forEach((inp, idx) => {
        questions.push({
          type: 'input',
          name: inp.name,
          message: `${inp.name}\n${chalk.grey(inp.description)}\n`,
          default: inp.default
        })
      })

      const answers = await inquirer.prompt(questions, {})
      inputs = Object.values(answers)
    }
    sendRunEvent(parsedBlockData.id, inputs, connection)
  } catch (err) {
    logError(err)
    logError(new Error('Unable to run block, please try again after some time.'))
  }
}

module.exports.initExistingBlock = async () => {
  let connection = null
  try {
    const blockPath = process.cwd()
    const token = userAuthCheck()

    const dirList = fs.readdirSync(blockPath)
    if (dirList && dirList.length > 0) {
      logError(new Error('You can only initialise existing block in empty folder.'))
      return
    }

    const existingBlockList = await getExistingBlockList(token)

    const blockChoiceList = []

    existingBlockList.forEach(b => {
      blockChoiceList.push({
        name: b.title || b.file,
        type: 'choice',
        value: b
      })
    })

    const { blockDoc } = await inquirer.prompt([{ name: 'blockDoc', message: 'Select block to initialise', type: 'list', choices: blockChoiceList }])

    const blockDataInternal = {
      blockId: blockDoc._id
    }

    const blockInfoFilePath = path.join(blockPath, BLOCK_INFO_FILE_RELATIVE_PATH)
    fs.mkdirSync(path.dirname(BLOCK_INFO_FILE_RELATIVE_PATH), { recursive: true })
    fs.writeFileSync(blockInfoFilePath, JSON.stringify(blockDataInternal), { encoding: 'utf8' })

    logSuccess('Initialising connection...')
    connection = await initializeBlock(blockDoc._id, blockPath, machineIdSync(), token)
    logSuccess('Connection established successfully.')
    logSuccess('Syncing data...')
    await pullChanges(blockDoc._id, blockPath, '', token)
    logSuccess('Data synced successfully.')
  } catch (err) {
    logError(err)
    logError('Unable to initialise block, Please try again after some time.')
  } finally {
    closeConnection(connection)
  }
}

module.exports.cloneBlock = async (args) => {
  const blockPath = process.cwd()
  const projectName = path.basename(blockPath)
  const { name, username } = args
  let connection = null

  try {
    let token = userAuthCheck()
    const blockData = await getBlockData(null, name || projectName, username, token)
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
    logSuccess(blockData.message)
    logSuccess('Initialising connection...')
    connection = await initializeBlock(blockData._id, blockPath, machineIdSync(), token)
    logSuccess('Connection established successfully.')
    logSuccess('Syncing data...')
    await pullChanges(blockData._id, blockPath, '', token)
    logSuccess('Data synced successfully.')
  } catch (err) {
    logError(err)
    logError(new Error('Unable to clone block, please try again after some time.'))
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
          name: `${connectedOAuthList[i].name}(${new Date(connectedOAuthList[i].createdAt).toLocaleString()})`,
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
        if (!parsedYamlData.auths) {
          parsedYamlData.auths = []
        }
        parsedYamlData.auths.push({ name: oAuthDoc.app_identifier })
        fs.writeFileSync(path.join(blockPath, 'dcoder_block.yml'), Yaml.stringify(parsedYamlData), { encoding: 'utf8' })
        logSuccess('Authentication added successfully.')
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
        logSuccess('Authentication added successfully.')
      } else {
        throw new Error('Unable to detect authentication.')
      }
    }
  } catch (err) {
    logError(err)
    logError(new Error('Unable to add app authentication, please try again after some time.'))
  }
}

module.exports.linkOAuth = async (args) => {
  try {
    const choiceList = []
    const blockPath = process.cwd()
    const token = userAuthCheck()
    const blockId = blockStatusCheck(blockPath)

    const blockOAuths = await getBlockOAuths(blockId, token)
    const connectedBlockOAuthList = []
    if (blockOAuths && blockOAuths.length > 0) {
      blockOAuths.forEach(bl => {
        connectedBlockOAuthList.push(bl.app_id.app_identifier)
      })
    }

    const blockYaml = fs.readFileSync(path.join(blockPath, 'dcoder_block.yml'), { encoding: 'utf8' })
    const parsedYamlData = Yaml.parse(blockYaml)

    const oAuthConnectChoiceList = []

    if (parsedYamlData && parsedYamlData.auths && parsedYamlData.auths.length > 0) {
      for (let i = 0; i < parsedYamlData.auths.length; i++) {
        if (!(connectedBlockOAuthList.includes(parsedYamlData.auths[i].name))) {
          oAuthConnectChoiceList.push({
            name: parsedYamlData.auths[i].name,
            type: 'choice',
            value: parsedYamlData.auths[i].name
          })
        }
      }
    }

    if (oAuthConnectChoiceList.length === 0) {
      console.log('No authentication to connect.')
      return
    }

    const { oAuthIdentifier } = await inquirer.prompt([{ name: 'oAuthIdentifier', message: 'Select authentication', type: 'list', choices: oAuthConnectChoiceList }])


    const authAppList = await getAllOAuthApps(token, [oAuthIdentifier])
    if (!authAppList || authAppList.length == 0) {
      throw new Error('Unable to fetch list of app authentications, please try again after some time.')
    }

    const oAuthDoc = authAppList.find(au => au.app_identifier === oAuthIdentifier)

    if (!oAuthDoc) {
      throw new Error('Authentication not found.')
    }

    const connectedOAuthList = await getConnectedOauthList(token, oAuthDoc._id)
    if (connectedOAuthList && connectedOAuthList.length > 0) {
      const connectedAuthChoiceList = []
      for (let i = 0; i < connectedOAuthList.length; i++) {
        connectedAuthChoiceList.push({
          name: `${connectedOAuthList[i].name}(${new Date(connectedOAuthList[i].createdAt).toLocaleString()})`,
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
        logSuccess('Authentication added successfully.')
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
        logSuccess('Authentication added successfully.')
      } else {
        throw new Error('Unable to detect authentication.')
      }
    }
  } catch (err) {
    logError(err)
    logError(new Error('Unable to add app authentication, please try again after some time.'))
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
    logError(err)
    logError(new Error('Unable to unlink, please try again in some time.'))
  }
}
