#!/usr/bin/env node
const program = require('commander');
const { createBlock, pushBlockChanges, runBlock } = require('../components/block')
const { userLogin } = require('../components/user')

/*******************************************/

// Print block-cli menu
program
    .command('block-init') // sub-command name
    .description('Initialize a new block on dcoder') // command description
    // function to execute when command is uses
    .option('-n --name [value]', 'Block name')
    .action(function (args) {
        createBlock(args);
    });

program
    .command('block-sync') // sub-command name
    .description('Sync block changes') // command description
    .action(function () {
        pushBlockChanges();
    });

program
    .command('block-run') // sub-command name
    .description('Sync block changes') // command description
    .option('-v --verbose', 'Show detailed output')
    .action(function (args) {
        runBlock(args);
    });

program
    .command('login') // sub-command name
    .description('login to dcoder') // command description
    .action(function () {
        userLogin();
    });


// allow commander to parse `process.argv`
program.parse(process.argv);