const authController = require('../controllers/authController.js');
const verifyToken = require('../controllers/authController').verifyToken;
// handle the http/https request and route them to the appropriate controller
const authRoutes = (app) => {
    app.route('/login')
        .post(authController.loginUser);
    app.route('/login')
        .options(authController.loginOpt);
    app.route('/regenerate')
        .post(authController.loginUser);
    app.route('/revoke')
        .post(verifyToken,authController.revoke);
    app.route('/reactivate')
        .post(verifyToken,authController.reactivate);
    app.route('/database')
        .post(verifyToken,authController.dbOps);
}

module.exports = {authRoutes}; 