import { Sequelize, DataTypes, Model } from 'sequelize';
import fs from 'fs';

// Check if the database file exists
const databaseFileName = 'skyscraper.sqlite';
let isDatabaseNew = !fs.existsSync(databaseFileName);

// Create a Sequelize instance
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: databaseFileName,
    logging: false,
});

// Define the Profile model
class Profile extends Model { }

Profile.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    did: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    handle: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    display_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    follows_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    followers_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    posts_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    indexed_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'Profile',
    timestamps: false,
});

// Define the Post model
class Post extends Model { }

Post.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    profile_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    uri: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    cid: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    author_did: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    text: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    reply_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    repost_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    like_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    indexed_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
}, {
    sequelize,
    modelName: 'Post',
    timestamps: false,
});

// If the database file didn't exist, create the tables
if (isDatabaseNew) {
    (async () => {
        await sequelize.sync();
    })();
}

export default { Profile, Post };
