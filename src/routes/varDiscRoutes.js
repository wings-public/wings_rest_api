const varDisController = require('../controllers/varDisController.js');
const indController = require('../controllers/indController.js');
const beaconController = require('../controllers/beaconController.js');
const verifyToken = require('../controllers/authController').verifyToken;


// Routes related to variant discovery request will be defined here.
// handle the http/https request and route them to the appropriate controller
const varDiscRoutes = (app) => {
    app.route('/variant/frequency')
        .post(verifyToken,varDisController.frequency);
    app.route('/variant/frequency/results')
        .get(verifyToken,varDisController.frequencyResults);
    app.route('/variant/frequency/beacon')
        .get(beaconController.BeaconVariant);
    app.route('/variant/association')
        .post(verifyToken,varDisController.associationReq)
    app.route('/variant/association/results')
        .get(verifyToken, varDisController.associationResults)
    app.route('/variant/association/collaborate')
        .post(verifyToken, varDisController.varPhenCollab);
    app.route('/hpo/tree')
        .post(verifyToken,varDisController.hpoTree);
    app.route('/hpo/tree/filter')
        .post(verifyToken,varDisController.hpoTreeFilter);
    app.route('/hpo/translate')
        .get(verifyToken,varDisController.hpoConvert);
    app.route('/variant/discovery/filter')
        .get(verifyToken,indController.trioFilter);
    app.route('/variant/discovery/filter/leaf')
        .post(verifyToken,indController.trioFilterLeaf);
    app.route('/variant/discovery/query')
        .post(verifyToken,varDisController.varPhenQuery);
    app.route('/variant/discovery/query/results')
        .get(verifyToken,varDisController.varPhenResults);
    app.route('/variant/discovery/statistics')
        .post(verifyToken, varDisController.varPhenStats);
    app.route('/variant/discovery/collaborate')
        .post(verifyToken,varDisController.varPhenCollab);
    app.route('/variant/collaborate/approve')
        .get(varDisController.varPhenCollabManage);
    app.route('/variant/collaborate/reject')
        .get(varDisController.varPhenCollabManage);
    app.route('/variant/discovery/collaborate/status')
        .get(verifyToken,varDisController.varPhenCollabStatus);
}

module.exports = {varDiscRoutes}; 
