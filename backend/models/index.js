'use strict';
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const db = {};
require('dotenv').config();
// Create sequelize instance using config
// SQLite file location (DB_FILE). Make sure its folder exists, e.g. a mounted volume on Railway.
const dbFile = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'database.sqlite');
fs.mkdirSync(path.dirname(dbFile), { recursive: true });
let sequelize = new Sequelize(
    {
        dialect: 'sqlite',
        storage: dbFile
    }
);
fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) &&
            (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize,
            Sequelize.DataTypes);
        db[model.name] = model;
    });
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});
db.sequelize = sequelize;
db.Sequelize = Sequelize;
module.exports = db;

