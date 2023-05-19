#!/usr/bin/env node
import fetch from 'node-fetch';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';

import pkg from '@atproto/api';
const { BskyAgent } = pkg;

global.fetch = fetch;

import { Op } from 'sequelize';
import database from './database.js';
const { Profile, Post } = database;

// Check if environment variables are defined
if (!process.env.BLUESKY_USERNAME || !process.env.BLUESKY_PASSWORD) {
  console.error('Error: Environment variables BLUESKY_USERNAME and BLUESKY_PASSWORD must be defined');
  process.exit(1);
}

// Start the bluesky agent
const agent = new BskyAgent({ service: 'https://bsky.social' });

// Convert a post URI to a URL
async function urlFromUri(username, uri) {
  let parts = uri.split("/");
  let lastPart = parts[parts.length - 1];
  return `https://bsky.app/profile/${username}/post/${lastPart}`;
}

// Insert or update a profile
async function upsertProfile(profileData) {
  // Check if profile already exists
  let profile = await Profile.findOne({ where: { did: profileData.did } });

  // Prepare the data object for creation or update
  const data = {
    did: profileData.did,
    handle: profileData.handle,
    display_name: profileData.displayName,
    description: profileData.description,
    follows_count: profileData.followsCount,
    followers_count: profileData.followersCount,
    posts_count: profileData.postsCount,
    indexed_at: profileData.indexedAt
  };

  // Remove any undefined values from data object
  Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

  if (!profile) {
    // Profile does not exist, create a new one
    profile = await Profile.create(data);
    console.log(`New profile created for ${profileData.did}`);
  } else {
    // Profile exists, update it
    await profile.update(data);
    console.log(`Existing profile updated for ${profileData.did}`);
  }

  return profile;
}


// Insert or update a post
async function upsertPost(verboseOutput, postData) {
  // Check if post already exists
  let post = await Post.findOne({ where: { uri: postData.uri } });

  if (!post) {
    // Make sure we have the author profile
    let profile = await upsertProfile({
      did: postData.author.did,
      handle: postData.author.handle,
      displayName: postData.author.displayName,
      indexedAt: postData.indexedAt
    });

    // Post does not exist, create a new one
    post = await Post.create({
      profile_id: profile.id,
      uri: postData.uri,
      cid: postData.cid,
      text: postData.record.text,
      created_at: postData.record.createdAt,
      reply_count: postData.replyCount,
      repost_count: postData.repostCount,
      like_count: postData.likeCount,
      indexed_at: postData.indexedAt,
      url: await urlFromUri(postData.author.handle, postData.uri)
    });
    console.log(`New post created with URL: ${post.url}`);
  } else {
    // Post exists, update it
    await post.update({
      reply_count: postData.replyCount,
      repost_count: postData.repostCount,
      like_count: postData.likeCount,
      indexed_at: postData.indexedAt,
    });
    console.log(`Existing post updated with URL: ${post.url}`);
  }

  if (verboseOutput) {
    console.log(postData);
  }

  return post;
}

async function displayPost(post) {
  let profile = await Profile.findByPk(post.dataValues.profile_id);
  console.log(chalk.bold(profile.dataValues.handle) + `: ${post.dataValues.text}`);
  console.log(chalk.dim(`${post.dataValues.created_at}`));
  console.log(chalk.dim(`Replies: ${post.dataValues.reply_count}, Reposts: ${post.dataValues.repost_count}, Likes: ${post.dataValues.like_count}`));
  console.log(chalk.blueBright.underline(post.dataValues.url));
  console.log();
}

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
    .command('list-profiles', 'List profiles', {}, async function() {
      const profiles = await Profile.findAll();
      for (let profile of profiles) {
        console.log(`${profile.handle} (${profile.display_name})`);
      }
    })

    .boolean('no_posts')
    .boolean('verbose')
    .boolean('connections')
    // Fetch a profile
    .command('fetch [username]', 'Fetch a profile', {
      no_posts: {
        default: false
      },
      connections: {
        default: false
      }
    }, async function(argv) {
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

      // Add the profile to the database
      let profile = await upsertProfile(profileData);

      if (argv.verbose) {
        console.log(profile.dataValues);
      }

      if (argv.connections) {
        const followsRes = await agent.getFollows({ actor: argv.username });
        const followersRes = await agent.getFollowers({ actor: argv.username });

        const followDIDs = [];
        for (let i = 0; i < followsRes.data.follows.length; i++) {
          const f = followsRes.data.follows[i];
          if (argv.verbose) {
            console.log(f);
          }
          await upsertProfile(f);
          followDIDs.push(f.did);
        }

        const followerDIDs = [];
        for (let i = 0; i < followersRes.data.followers.length; i++) {
          const f = followersRes.data.followers[i];
          if (argv.verbose) {
            console.log(f);
          }
          await upsertProfile(f);
          followerDIDs.push(f.did);
        }

      }

      // Load all of the profile's posts
      let posts = [];
      let cursor = null;
      while (!argv.no_posts && true) {
        try {
          // Make the API request
          let params = { actor: profile.handle, limit: 100 }
          if (cursor) {
            params.cursor = cursor;
          }
          const ret = await agent.getAuthorFeed(params);
          posts = ret.data.feed;
          cursor = ret.data.cursor;
          if (!cursor) {
            break;
          }
        } catch (error) {
          console.error(error);
          return;
        }

        // Add the posts to the database
        for (let postData of posts) {
          await upsertPost(argv.verbose, postData.post);
        }
      }
    })

    // Search for posts
    .command('search [query]', 'Search', {
      username: {
        alias: 'u',
        describe: 'The username to search',
        type: 'string'
      }
    }, async function(argv) {
      // Construct a where clause for the search query
      let whereClause = {
        text: {
          [Op.like]: `%${argv.query}%`
        }
      };

      // If a username is provided, find the corresponding profile
      if (argv.username) {
        const profile = await Profile.findOne({
          where: { handle: argv.username }
        });

        // If the profile exists, add profile_id to the where clause
        if (profile) {
          whereClause['profile_id'] = profile.id;
        } else {
          // If no such profile exists, return an empty array
          console.log(`No profile found for username ${username}`);
          return;
        }
      }

      // Execute the search query
      const posts = await Post.findAll({
        where: whereClause,
        order: [['created_at', 'ASC']]
      });

      console.log(`Found ${posts.length}\n`);

      for (let post of posts) {
        await displayPost(post);
      }
    })

    // Read posts from a user sequentially
    .command('read-posts [username]', 'Read posts sequentially', {}, async function(argv) {
      const profile = await Profile.findOne({ where: { handle: argv.username } });
      const posts = await Post.findAll({
        where: { profile_id: profile.id },
        order: [['created_at', 'ASC']]
      });

      console.log(`Found ${posts.length}\n`);

      for (let post of posts) {
        await displayPost(post);
      }
    })

    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .argv;
})();
