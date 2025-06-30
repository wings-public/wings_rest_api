
const sampController = require('../controllers/sampController.js');
const indController = require('../controllers/indController.js');
const verifyToken = require('../controllers/authController').verifyToken;

// Routes related to Individuals and family will be defined here.
// handle the http/https request and route them to the appropriate controller
const sampRoutes = (app) => {
    app.route('/samples')
        .get(verifyToken,sampController.samples) 
    app.route('/samples/filter')
        .get(verifyToken,indController.trioFilter)
    app.route('/samples/filter/leaf')
        .post(verifyToken,indController.trioFilterLeaf)   
    app.route('/samples/discovery')
        .post(verifyToken,sampController.sampDisc)    
    app.route('/samples/discovery/results')
        //.post(verifyToken,sampController.sampDiscReq)                          
        .get(verifyToken,indController.trioInheritResult)
    app.route('/SV_samples')
        .get(verifyToken,sampController.SVsamples) 
    app.route('/SV_samples/discovery')
        .post(verifyToken,sampController.SVsampDisc) 
    app.route('/SV_samples/discovery/results')                        
        .post(verifyToken,indController.SVQueryResult)
    app.route('/SV_samples/trio_discovery')
        .post(verifyToken,sampController.SVTrioDisc)
    app.route('/SV_samples/trio_discovery/results')                        
        .post(verifyToken,indController.SVQueryResult) 
    app.route('/samplesheet/status')
        .get(verifyToken,sampController.sampSheetStatus)
    
}

module.exports = {sampRoutes}; 