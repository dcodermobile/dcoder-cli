#!/usr/bin/env node
const program = require('commander')
const { userLogin } = require('../components/user')
const { getMyAuths } = require('../components/oAuth')
const { createBlock, syncBlockChanges, runBlock, cloneBlock, addOauth, unlinkOAuth } = require('../components/block')

const baseCommand = program.command('block').description('Block commands')
const authenticationBaseCommand = baseCommand.command('authentication').description('Block authentication commands')

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
    .action(function (args) {
        cloneBlock(args)
    })

baseCommand
    .command('sync') // sub-command name
    .description('Sync block changes') // command description
    .action(function () {
        syncBlockChanges()
    })

authenticationBaseCommand
    .command('add') // sub-command name
    .description('Add authentication to block') // command description
    .action(function () {
        addOauth()
    })

authenticationBaseCommand
    .command('unlink') // sub-command name
    .description('Unlink authentication connected to block') // command description
    .action(function () {
        unlinkOAuth()
    })

baseCommand
    .command('run') // sub-command name
    .description('Run block') // command description
    .action(function (args) {
        runBlock(args)
    })

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