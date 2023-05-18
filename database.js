import { Sequelize, DataTypes, Model } from 'sequelize';
import fs from 'fs';

// Check if the database file exists
const databaseFileName = 'skyscraper.sqlite';
let isDatabaseNew = !fs.existsSync(databaseFileName);

// Create a Sequelize instance
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: databaseFileName
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

// If the database file didn't exist, create the Profile table
if (isDatabaseNew) {
    (async () => {
        await sequelize.sync();
    })();
}

export default Profile;
