var path = require('path');
// config for your database
 const result = require('dotenv').config({ debug: process.env.DEBUG , path: './config/.env'});

 var parsePath = path.parse(__dirname).dir;

 db_config = {
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    server: process.env.DB_SERVER, 
    database: process.env.DB_NAME,
    trustServerCertificate: true
    /*
    options: {
        encrypt: true, // for azure
        trustServerCertificate: false // change to true for local dev / self-signed certs
    }*/
}

module.exports = {db_config}