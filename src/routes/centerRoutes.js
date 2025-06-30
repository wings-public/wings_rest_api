const centerController = require('../controllers/centerController.js');
const verifyToken = require('../controllers/authController').verifyToken;

// Routes related to Individuals and family will be defined here.
// handle the http/https request and route them to the appropriate controller
const centerRoutes = (app) => {
    app.route('/hostid')
        .get(verifyToken,centerController.hosts);
}

module.exports = {centerRoutes}; 