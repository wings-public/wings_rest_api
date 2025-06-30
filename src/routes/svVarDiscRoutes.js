const SVvarDisController = require('../controllers/svVarDiscController.js');
const indController = require('../controllers/indController.js');
const verifyToken = require('../controllers/authController').verifyToken;


// Routes related to variant discovery request will be defined here.
// handle the http/https request and route them to the appropriate controller
const svVarDiscRoutes = (app) => {

    app.route('/SVvariant/discovery/query')
        .post(verifyToken,SVvarDisController.varPhenQuery);
    app.route('/SVvariant/discovery/query/results')
        .post(verifyToken,SVvarDisController.varPhenResults);
    app.route('/SVvariant/discovery/statistics')
        .post(verifyToken,SVvarDisController.varPhenStats);
}

module.exports = {svVarDiscRoutes}; 
