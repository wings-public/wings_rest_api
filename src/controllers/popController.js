const authServices = require('../services/authServices.js');
const indServices = require('../services/sampServices.js');
const indCont = require('../controllers/indController.js');
const popServices = require('../services/popServices.js');  
const {decodePayload,centerApiToken,getCenter,checkUserAccessToPI} = authServices
const {tokenOps} = indCont;
const {createPopulation,getPopulationsPIID,addIndSamp,removeIndSamp} = popServices;

const createPop = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        console.log(data);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if ( ! req.body.piid || ! req.body.host_id || ! req.body.description || ! req.body.seqType) {
            next("Missing request body parameters")
        }

        var piid = req.body.piid;
        var host_id = req.body.host_id;
        // validate the host id
        console.log(req.body);
        console.log("********************************");
        console.log(`piid:${piid} host_id:${host_id} user_id:${user_id}`);
        var resp = await checkUserAccessToPI(user_id,center_id,piid,db_conn);
        if ( resp === "success" ) {
            var resp = await createPopulation(piid,user_id,center_id,host_id,req.body.description,req.body.seqType,db_conn);
            console.log(resp);
            res.json({"message":resp});
        }
        else{
            res.json({"message":resp});
        }

          
    } catch(err) {
        next(err)
    }
}

const getPop = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        console.log(data);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if ( ! req.body.piid || ! req.body.host_id ) {
            next("Missing request body parameters")
        }

        var piid = req.body.piid;
        var host_id = req.body.host_id;
        // validate the host id

        console.log("********************************");
        console.log(`piid:${piid} host_id:${host_id} user_id:${user_id}`);
        var resp = await getPopulationsPIID(piid,host_id,user_id,center_id,db_conn);

        console.log(resp);
        res.json({"message":resp});
          
    } catch(err) {
        next(err)
    }
}

const addIndividSamp = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        console.log(data);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        req.body.UserID = user_id;
        req.body.CenterID = center_id;
        req.body.HostID = req.body.host_id;
        req.body.PIID = req.body.piid;

        var piid = req.body.piid;
        var host_id = req.body.host_id;

        delete req.body.host_id;    
        delete req.body.piid;
      
        // validate the host id

        console.log("********************************");
        console.log(`piid:${piid} host_id:${host_id} user_id:${user_id}`);
        var resp = await addIndSamp(req.body,db_conn);

        console.log(resp);
        res.json({"message":resp});
          
    } catch(err) {
        next(err)
    }
}

const removeIndividSamp = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        console.log(data);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        req.body.UserID = user_id;
        req.body.CenterID = center_id;
        req.body.HostID = req.body.host_id;
        req.body.PIID = req.body.piid;

        var piid = req.body.piid;
        var host_id = req.body.host_id;

        delete req.body.host_id;    
        delete req.body.piid;
      
        // validate the host id

        console.log("********************************");
        console.log(`piid:${piid} host_id:${host_id} user_id:${user_id}`);
        var resp = await removeIndSamp(req.body,db_conn);

        console.log(resp);
        res.json({"message":resp});
          
    } catch(err) {
        next(err)
    }
}
module.exports = {createPop,getPop,addIndividSamp,removeIndividSamp,removeIndividSamp}