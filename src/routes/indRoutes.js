
const indController = require('../controllers/indController.js');
const verifyToken = require('../controllers/authController').verifyToken;

// Routes related to Individuals and family will be defined here.
// handle the http/https request and route them to the appropriate controller
const indRoutes = (app) => {
    app.route('/individuals')
        .get(verifyToken,indController.individuals);
    app.route('/individuals/:indId')
        .get(verifyToken,indController.individuals);
    app.route('/individuals/:indId')
        .put(verifyToken,indController.individuals)
    app.route('/families')
        .get(verifyToken,indController.families);
    app.route('/families/id/:famId')
        .get(verifyToken,indController.families);
    app.route('/families/membertype')
        .get(verifyToken,indController.membertype);
    app.route('/piid')
        .get(verifyToken,indController.piidExec)
    app.route('/families')
        .post(verifyToken,indController.createFamily)
    app.route('/families/assign')
        .post(verifyToken,indController.assignMembers)
    app.route('/families/unassign')
        .post(verifyToken,indController.unassignMembers)
    app.route('/families/unassigned')
        .get(verifyToken,indController.unassignedMembers)
    app.route('/families/analysis/options')
        .get(verifyToken,indController.familyAnalysisOpt)
    app.route('/families/preprocessing')
        .post(verifyToken,indController.familyPreprocess)
    app.route('/families/preprocessing/status/:famLocalID')
        .get(verifyToken,indController.familyPreprocessStatus)
    app.route('/families/filter/query')
        .post(verifyToken,indController.familyFilterQuery)
    app.route('/families/filter/query/results')
        .get(verifyToken,indController.trioInheritResult)
    app.route('/families/filter')
        .get(verifyToken,indController.trioFilter)
    app.route('/families/filter/leaf')
        .post(verifyToken,indController.trioFilterLeaf)
    app.route('/individuals/phenotype')
        .post(verifyToken,indController.editPhenotype)
    app.route('/individuals/phenotype')
        .delete(verifyToken,indController.editPhenotype)
    app.route('/trios')
        .get(verifyToken,indController.trios)
    app.route('/trios/filter')
        .get(verifyToken,indController.trioFilter)
    app.route('/trios/filter/leaf')
        .post(verifyToken,indController.trioFilterLeaf)
    app.route('/trios/inheritance')
        .post(verifyToken,indController.trioInherit)
    app.route('/trios/inheritance/results')
        .get(verifyToken,indController.trioInheritResult)
}

module.exports = {indRoutes}; 