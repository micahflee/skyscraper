#!/usr/bin/env node
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const { BskyAgent } = require('@atproto/api');

// Check if environment variables are defined
if (!process.env.BLUESKY_USERNAME || !process.env.BLUESKY_PASSWORD) {
    console.error('Error: Environment variables BLUESKY_USERNAME and BLUESKY_PASSWORD must be defined');
    process.exit(1);
}

const agent = new BskyAgent({ service: 'https://bsky.social' });

(async () => {
    await agent.login({
        identifier: process.env.BLUESKY_USERNAME,
        password: process.env.BLUESKY_PASSWORD,
    });

    yargs(hideBin(process.argv))
        .command('list-users', 'List users', {}, function () {
            console.log('list-users: Not implemented');
        })
        .command('fetch [username]', 'Fetch a user', {}, function (argv) {
            console.log(`fetch: Not implemented. Username: ${argv.username}`);
        })
        .command('search [query]', 'Search', {
            username: {
                alias: 'u',
                describe: 'The username to search',
                type: 'string'
            }
        }, function (argv) {
            console.log(`search: Not implemented. Username: ${argv.username}, Query: ${argv.query}`);
        })
        .demandCommand(1, 'You need at least one command before moving on')
        .help()
        .argv;
})();
