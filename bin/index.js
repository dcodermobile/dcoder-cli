#!/usr/bin/env node
const program = require('commander')
const { userLogin } = require('../components/user')
const { getMyAuths } = require('../components/oAuth')
const { createBlock, syncBlockChanges, runBlock, cloneBlock, addOauth, unlinkOAuth, linkOAuth, publishUserBlock, updateBlockInfo } = require('../components/block/block')
const { getVersionList, createVersion } = require('../components/block/version/version')
const { runBlockRunCommands, getBlockRunCommands } = require('../components/block/runCommand/runCommand')

const baseCommand = program.command('block').description('Block commands')
const blockAuthenticationBaseCommand = baseCommand.command('authentication').description('Block authentication commands')
const blockVersionBaseCommand = baseCommand.command('version').description('Block version commands')
const blockRunBaseCommand = baseCommand.command('run-command').description('Block run commands')

// ========== BLOCK COMMANDS =========================

baseCommand
    .command('init') // sub-command name
    .description('Initialize a new block on dcoder') // command description
    .option('-n --name [value]', 'Block name')
    .action(function (args) {
        createBlock(args)
    })

baseCommand
    .command('clone') // sub-command name
    .description('Clone an existing block from dcoder') // command description
    .option('-n --name [value]', 'Block name')
    .option('-u --username [value]', 'User name')
    .action(function (args) {
        cloneBlock(args)
    })

baseCommand
    .command('sync') // sub-command name
    .description('Sync block changes') // command description
    .action(function () {
        syncBlockChanges()
    })

baseCommand
    .command('run') // sub-command name
    .description('Run block') // command description
    .action(function (args) {
        runBlock(args)
    })

baseCommand
    .command('publish') // sub-command name
    .description('Publish block') // command description
    .action(function (args) {
        publishUserBlock(args)
    })

baseCommand
    .command('update-info') // sub-command name
    .description('Update block info') // command description
    .option('--title [value]', 'Block title')
    .option('--description [value]', 'Block description')
    .option('--tags [value]', 'Block tags(comma seperated)')
    .option('--auto-install-package [value]', 'Auto install package config(true/false)')
    .action(function (args) {
        updateBlockInfo(args)
    })

// ========== BLOCK AUTHENTICATION COMMANDS =========================

blockAuthenticationBaseCommand
    .command('add') // sub-command name
    .description('Add authentication to block') // command description
    .action(function () {
        addOauth()
    })

blockAuthenticationBaseCommand
    .command('link') // sub-command name
    .description('link existing authentication to block') // command description
    .action(function () {
        linkOAuth()
    })

blockAuthenticationBaseCommand
    .command('unlink') // sub-command name
    .description('Unlink authentication connected to block') // command description
    .action(function () {
        unlinkOAuth()
    })

// ========== BLOCK VERSION COMMANDS =========================
blockVersionBaseCommand
    .command('list') // sub-command name
    .description('List block version') // command description
    .action(function () {
        getVersionList()
    })

blockVersionBaseCommand
    .command('create') // sub-command name
    .description('Create block version') // command description
    .action(function () {
        createVersion()
    })

// ========== BLOCK RUN COMMANDS =========================
blockRunBaseCommand
    .command('list') // sub-command name
    .description('List block run command') // command description
    .action(function () {
        getBlockRunCommands()
    })

blockRunBaseCommand
    .command('run') // sub-command name
    .description('Run block run command') // command description
    .action(function () {
        runBlockRunCommands()
    })

// ========== USER COMMANDS =========================

program
    .command('login') // sub-command name
    .description('Login to dcoder') // command description
    .action(function () {
        userLogin()
    })

program
    .command('authentication') // sub-command name
    .description('List user authentications') // command description
    .action(function () {
        getMyAuths()
    })


// allow commander to parse `process.argv`
program.parse(process.argv)