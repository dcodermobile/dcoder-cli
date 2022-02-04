#!/usr/bin/env node
const program = require('commander')
const { userLogin } = require('../components/user')
const { getMyAuths } = require('../components/oAuth')
const { createBlock, syncBlockChanges, runBlock, cloneBlock, addOauth, unlinkOAuth, linkOAuth, publishUserBlock, updateBlockInfo, initExistingBlock } = require('../components/block/block')
const { getVersionList, createVersion } = require('../components/block/version/version')
const { runBlockRunCommands, getBlockRunCommands } = require('../components/block/runCommand/runCommand')
const { generateBlockReadMe } = require('../components/block/readme/readme')
const { openSourceGuideline, contributionGuideline } = require('../components/block/openSource/openSource')

const baseCommand = program.command('block').description('Block commands')

// ========== BLOCK COMMANDS =========================

baseCommand
    .command('init') // sub-command name
    .description('Initialize a new block on dcoder') // command description
    .option('-n --name [value]', 'Block name')
    .action(function (args) {
        createBlock(args)
    })

baseCommand
    .command('init:existing') // sub-command name
    .description('Clone an existing block from dcoder') // command description
    .action(function (args) {
        initExistingBlock(args)
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

baseCommand
    .command('authentication:add') // sub-command name
    .description('Add authentication to block') // command description
    .action(function () {
        addOauth()
    })

baseCommand
    .command('authentication:link') // sub-command name
    .description('link existing authentication to block') // command description
    .action(function () {
        linkOAuth()
    })

baseCommand
    .command('authentication:unlink') // sub-command name
    .description('Unlink authentication connected to block') // command description
    .action(function () {
        unlinkOAuth()
    })

// ========== BLOCK VERSION COMMANDS =========================
baseCommand
    .command('version:list') // sub-command name
    .description('List block version') // command description
    .action(function () {
        getVersionList()
    })

baseCommand
    .command('version:create') // sub-command name
    .description('Create block version') // command description
    .action(function () {
        createVersion()
    })

// ========== BLOCK RUN COMMANDS =========================
baseCommand
    .command('run-command:list') // sub-command name
    .description('List block run command') // command description
    .action(function () {
        getBlockRunCommands()
    })

baseCommand
    .command('run-command:run') // sub-command name
    .description('Run block run command') // command description
    .action(function () {
        runBlockRunCommands()
    })

// ========== BLOCK README COMMANDS =========================
baseCommand
    .command('readme') // sub-command name
    .description('Generate block readme file') // command description
    .action(function () {
        generateBlockReadMe()
    })

// ========== BLOCK OPEN SOURCE COMMANDS =========================
baseCommand
    .command('open-source') // sub-command name
    .description('Block open source process guideline') // command description
    .action(function () {
        openSourceGuideline()
    })

baseCommand
    .command('contribution-guideline') // sub-command name
    .description('Block open source contribution guideline') // command description
    .action(function () {
        contributionGuideline()
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