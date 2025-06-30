const helloController = require('../controllers/helloController.js');
const verifyToken = require('../controllers/authController').verifyToken;

// handle the http/https request and route them to the appropriate controller
const helloRoutes = (app) => {
    app.route('/hello')
        .get(verifyToken,helloController.loginMsg);
}

module.exports = {helloRoutes}; 