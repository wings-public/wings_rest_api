
const sampController = require('../controllers/sampController.js');
const popController = require('../controllers/popController.js');
const verifyToken = require('../controllers/authController').verifyToken;
const indController = require('../controllers/indController.js');

// Routes related to Individuals and family will be defined here.
// handle the http/https request and route them to the appropriate controller
const popRoutes = (app) => {
    app.route('/populations')
        .get(verifyToken,popController.getPop) 
    app.route('/newPopulation')
        .post(verifyToken,popController.createPop) 
    app.route('/population/addIndividualSample')
        .post(verifyToken,popController.addIndividSamp)
    app.route('/population/removeIndividualSample')
        .post(verifyToken,popController.removeIndividSamp)
    app.route('/population/populationFileFiltering')
        .post(verifyToken,sampController.SVPopFilterSample)
    app.route('/population/populationFileFiltering/results')                        
        .post(verifyToken,indController.SVQueryResult)  
    
    
}

module.exports = {popRoutes}; 