#!/usr/bin/env node
import fetch from 'node-fetch';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import pkg from '@atproto/api';
const { BskyAgent } = pkg;

global.fetch = fetch;

import Profile from './database.js';

// Check if environment variables are defined
if (!process.env.BLUESKY_USERNAME || !process.env.BLUESKY_PASSWORD) {
    console.error('Error: Environment variables BLUESKY_USERNAME and BLUESKY_PASSWORD must be defined');
    process.exit(1);
}

// Start the bluesky agent
const agent = new BskyAgent({ service: 'https://bsky.social' });

(async () => {
    try {
        await agent.login({
            identifier: process.env.BLUESKY_USERNAME,
            password: process.env.BLUESKY_PASSWORD,
        });
    } catch (error) {
        console.error('Error: Failed to login. Please check your BLUESKY_USERNAME and BLUESKY_PASSWORD.');
        process.exit(1);
    }

    yargs(hideBin(process.argv))
        // List profiles
        .command('list-profiles', 'List profiles', {}, async function () {
            console.log('list-profiles: Not implemented');
        })

        // Fetch a profile
        .command('fetch [username]', 'Fetch a profile', {}, async function (argv) {
            console.log(`Loading profile: ${argv.username}`);
            let profileData = null;

            // Load the profile from the API
            try {
                const ret = await agent.getProfile({ actor: argv.username });
                profileData = ret.data;
            } catch (error) {
                console.error(`Error: Failed to fetch user ${argv.username}`);
                return;
            }

            // Check if profile already exists
            let profile = await Profile.findOne({ where: { did: profileData.did } });

            if (!profile) {
                // Profile does not exist, create a new one
                profile = await Profile.create({
                    did: profileData.did,
                    handle: profileData.handle,
                    display_name: profileData.displayName,
                    description: profileData.description,
                    follows_count: profileData.followsCount,
                    followers_count: profileData.followersCount,
                    posts_count: profileData.postsCount,
                    indexed_at: profileData.indexedAt
                });
                console.log(`New profile created for ${argv.username}`);
            } else {
                // Profile exists, update it
                await profile.update({
                    handle: profileData.handle,
                    display_name: profileData.displayName,
                    description: profileData.description,
                    follows_count: profileData.followsCount,
                    followers_count: profileData.followersCount,
                    posts_count: profileData.postsCount,
                    indexed_at: profileData.indexedAt
                });
                console.log(`Existing profile updated for ${argv.username}`);
            }

            console.log(profile);
        })


        // Search for posts
        .command('search [query]', 'Search', {
            username: {
                alias: 'u',
                describe: 'The username to search',
                type: 'string'
            }
        }, async function (argv) {
            console.log(`search: Not implemented. Username: ${argv.username}, Query: ${argv.query}`);
        })

        .demandCommand(1, 'You need at least one command before moving on')
        .help()
        .argv;
})();
