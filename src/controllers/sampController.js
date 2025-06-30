const authServices = require('../services/authServices.js');
const sampServices = require('../services/sampServices.js');
const indCont = require('../controllers/indController.js');

const {decodePayload,centerApiToken,getCenter} = authServices
const {tokenOps} = indCont;
const {getSampFileList,sampDiscReq,getSVSampFileList,SVsampDiscReq,sampSheetSp} = sampServices;

// Function to create a new family
const samples = async(req,res,next) => {
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
        var resp = await getSampFileList(piid,host_id,user_id,center_id,db_conn);
        console.log(resp);
        res.json({"message":resp});
          
    } catch(err) {
        next(err)
    }
}

const SVsamples = async(req,res,next) => {
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
        console.log(req.body);
        console.log("********************************");
        console.log(`piid:${piid} host_id:${host_id} user_id:${user_id}`);
        var resp = await getSVSampFileList(piid,host_id,user_id,center_id,db_conn);
        console.log(resp);
        res.json({"message":resp});
          
    } catch(err) {
        next(err)
    }
}

// Function to get the trios defined for the family
const sampDisc = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if ( ! req.body.samp_id || ! req.body.host_id || ! req.body.file_id || ! req.body.filter_id || ! req.body.ref_build_type || ! req.body.filter_level ) {
            throw "Missing required parameters in the request";
        }

        var samp_id = req.body.samp_id;
        var file_id = req.body.file_id;
        var host_id = req.body.host_id;
        var filter_id = req.body.filter_id;
        var ref_build_type = req.body.ref_build_type;
        var select_filter = req.body.filter_level;
        
        //var filter_result = await getFilterLeaf(user_id,filter_id,db_conn);
        var samp_req_id = await sampDiscReq(user_id,center_id,host_id,samp_id,file_id,ref_build_type,select_filter,filter_id,db_conn);
    
        res.json({"message":{"request_id":samp_req_id}});
        //res.json({"message":"success"});

    } catch(err) {
        next(err)
    }
}

const SVsampDisc = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if ( ! req.body.individualID ||  ! req.body.fileID || ! req.body.host_id ) {
            throw "Missing required parameters in the request";
        }

        req.body.UserID = user_id;
        req.body.CenterID = center_id;
        
        //var filter_result = await getFilterLeaf(user_id,filter_id,db_conn);
        var samp_req_id = await SVsampDiscReq(req.body,db_conn);
        delete samp_req_id.next_page;
        console.log(samp_req_id);
        res.json({"message":{"request_id":samp_req_id}});
        //res.json({"message":"success"});

    } catch(err) {
        next(err)
    }
}

const SVTrioDisc = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if ( ! req.body.TrioLocalID || ! req.body.host_id  || req.body.piid ) {
            throw "Missing required parameters in the request";
        }

        req.body.UserID = user_id;
        req.body.CenterID = center_id;
        
        //var filter_result = await getFilterLeaf(user_id,filter_id,db_conn);
        var samp_req_id = await SVsampDiscReq(req.body,db_conn);
    
        res.json({"message":{"request_id":samp_req_id}});
        //res.json({"message":"success"});

    } catch(err) {
        next(err)
    }
}

const SVPopFilterSample = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if ( ! req.body.PopulationID || ! req.body.fileID_to_filter || ! req.body.host_id  || req.body.piid ) {
            throw "Missing required parameters in the request";
        }

        req.body.UserID = user_id;
        req.body.CenterID = center_id;
        
        //var filter_result = await getFilterLeaf(user_id,filter_id,db_conn);
        var samp_req_id = await SVsampDiscReq(req.body,db_conn);
    
        res.json({"message":{"request_id":samp_req_id}});
        //res.json({"message":"success"});

    } catch(err) {
        next(err)
    }
}

// Function to get the status of sample sheet for a specific date
const sampSheetStatus = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        console.log("Hello there!");
        console.log(req.query.date);
        console.log(req.query.host_id);
        if ( ! req.query.date || ! req.query.host_id  ) {
            throw "Missing required parameters in the request";
        }

        var date_param = req.query.date;
        var host_id = req.query.host_id;
        
        //var filter_result = await getFilterLeaf(user_id,filter_id,db_conn);
        var response = await sampSheetSp(user_id,center_id,host_id,date_param,db_conn);
        var respArr = response['message']

        var statusCounts = {};
        if ( respArr.length > 0 ) {
            
            respArr.forEach(item => {
                console.log("Logging Item")
                console.log(item);
                const status = item.Status;
                console.log("Logging status");
                console.log(status);
                if (statusCounts[status]) {
                  // Increment the count if the status already exists in the object
                  statusCounts[status]++;
                } else {
                  // Initialize the count if the status does not exist in the object
                  statusCounts[status] = 1;
                }
              });
        }
        var respObj = {'counts' : statusCounts, 'details' : response['message']};

        
        res.json({"message":respObj});
        //res.json({"message":"success"});

    } catch(err) {
        next(err)
    }
}

module.exports = {samples,sampDisc,SVsamples,SVsampDisc,SVTrioDisc,SVPopFilterSample,sampSheetStatus}