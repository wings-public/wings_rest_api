const svVarDiscServices = require('../services/svVarDiscServices.js');
const indCont = require('../controllers/indController.js');
const {tokenOps} = indCont;
const {centerList,varReqGenSp,varFreqResSp,storeReqDB,getVarDiscReqObj,getHPOParent,getHPOChild,varPhenReqSp,getAdminID,varPhenResultSp,varPhenStatsSp} = svVarDiscServices;
const { v4: uuidv4 } = require('uuid');
const lodash = require('lodash');









// Function to launch the variant freq query across the different centers
const varPhenQuery = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn, req.token);
        const process_id = uuidv4();
        var user_id = data['user_id'];
        var center_id = data['center_id'];
        console.log("varPhenQuery------");
        // query_type - 
        if (! req.body.sv_type  ||! req.body.start_chr ||! req.body.start_pos  ||! req.body.seq_type  || ! req.body.seq_type  || ! req.body.ref_build_type ) {
            throw "Missing required parameters in the request";
        }
        if(req.body.sv_type === 'TRA'){
            if(! req.body.end_chr ){
                throw "Missing required parameters in the request - translocations require an end chromosome";
            }
        }
        else if(! req.body.sv_len ){
            throw "Missing required parameters in the request - all SVs except translocations require an SV length";
        }
        

        var assembly_type = req.body.ref_build_type;
        var seq_type = req.body.seq_type;
        var hpo_list = req.body.hpo_list;
        req.body.process_id = process_id;
        var json_req = req.body;
        
        //console.log("Logging json request ");
        //console.dir(json_req,{"depth":null});
        

        if (['hg38','GRCh38'].indexOf(assembly_type) < 0 ) {
            //if ( assemblyType != 'hg19' || assemblyType != 'hg38' || assemblyType != 'GRCh37' || assemblyType != 'GRCh38' ) {
                throw "assemblyType: Supported options are hg38/GRCh38";
        }


        // Get the list of centers 
        var centers_info = await centerList(db_conn);
        // Loop 
        var reqObj = [];
        // get the host id , center id and the URL 
        for (var i in  centers_info ) {
            var centerObj = centers_info[i];
            var apiVersion = centerObj['APIVersion'];
            console.log(centerObj['CenterID']);
            console.log(centerObj['HostID']);
            // Variant Discovery APIs are available only from Client API Version 5.0
            if ( apiVersion >= "5.0" ) {
                var admin_id = await getAdminID(db_conn,centerObj['CenterID'],centerObj['HostID']);
                console.log(`admin_id:${admin_id}`);
                // send request to all centers ( all hosts)
                var resp = await varPhenReqSp(db_conn, centerObj['CenterID'], centerObj['HostID'], json_req, admin_id);
                //console.log(resp);
                reqObj.push(process_id);
            }
        }
        // Function to send variant disc request

        //var filter_result = await getFilterLeaf(user_id,filter_id,db_conn);
        //var samp_req_id = await sampDiscReq(user_id,center_id,host_id,samp_id,file_id,ref_build_type,select_filter,filter_id,db_conn);
    
        // store the response in a table. Return only the auto-incremented ID

        var req_id = process_id;
        console.log("Logging the returned request id "+process_id);
        res.json({"message":{"request_id":req_id}});
        //res.json({"message":"success"});

    } catch(err) {
        next(err)
    }
}


// Function to get the variant phen results
const varPhenResults = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];


        if ( ! req.body.request_id  ) {
            throw "Missing required parameters in the request";
        }

        var centers_info = await centerList(db_conn);
        var reqObj = [];
        // get the host id , center id and the URL 
        for (var i in  centers_info ) {
            var centerObj = centers_info[i];
            var apiVersion = centerObj['APIVersion'];
            console.log(centerObj['CenterID']);
            console.log(centerObj['HostID']);
            // Variant Discovery APIs are available only from Client API Version 5.0
            if ( apiVersion >= "5.0" ) {
                var admin_id = await getAdminID(db_conn,centerObj['CenterID'],centerObj['HostID']);
                console.log(`admin_id:${admin_id}`);
                // send request to all centers ( all hosts)
                var resp = await varPhenResultSp(db_conn, req.body.request_id,centerObj['CenterID'],centerObj['HostID']);
                reqObj.push(resp);
            }
        }
        // Loop 
        var respObj = {'status' : 'inprogress'};
        var inprogress = 0;
        
        var data = [];
        // if any of the center has inprogress - then overall status = inprogress
        // if all centers finished - then overall counts has to be cumulated
        // reqObjList - request id from all the centers

        var overallFreqObj = {'var+phen': 0, 'var-phen': 0, '-var+phen': 0, '-var-phen': 0};
        for (var i in  reqObj ) {
            var tmp_reqObj = reqObj[i];

        
            // check status during error
            if (tmp_reqObj[0]['status'] && (tmp_reqObj[0]['status'] == "computing")) {
                throw "Some centers are still computing";
            } else if (tmp_reqObj[0]['status'] && (tmp_reqObj[0]['status'] == "complete") ) {
                //console.log("Logging the response object ----");
                //console.log(resp);
                overallFreqObj['var+phen'] += tmp_reqObj[0]['all_cases']['var+phen']; // 0 + 0 = 0
                overallFreqObj['var-phen'] += tmp_reqObj[0]['all_cases']['var-phen']; // 0 + 0 = 0
                overallFreqObj['-var+phen'] += tmp_reqObj[0]['all_cases']['-var+phen']; // 0 + 0 = 0
                overallFreqObj['-var-phen'] += tmp_reqObj[0]['all_cases']['-var-phen']; // 0 + 50 = 50
            } 
            
        }
        console.log(overallFreqObj);
        respObj['status'] = 'complete'
        respObj['overall'] = overallFreqObj;
        //console.log("Logging the variant annotation object ----- ");
        //console.dir(variantCntAnnObj,{"depth":null});
        //console.log("Logging the count object ");
        //console.dir(varCntObj,{"depth":null});
        //console.log("Logging the overall freq object")
        //console.dir(overallFreqObj,{"depth":null});
        // Function to send variant disc request

        //var filter_result = await getFilterLeaf(user_id,filter_id,db_conn);
        //var samp_req_id = await sampDiscReq(user_id,center_id,host_id,samp_id,file_id,ref_build_type,select_filter,filter_id,db_conn);
    
        res.json({"message":respObj});
        //res.json({"message":"success"});

    } catch(err) {
        next(err)
    }
}

// Function to launch the variant freq query across the different centers
const varPhenStats = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var resp = "";
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        //console.log(data);
        //console.log("varPhenStats --- ")
        var user_id = data['user_id'];
        var center_id = data['center_id'];
        //console.log("varPhenQuery------");
        // query_type - 
        //console.log(req.body.overall);
        //console.log(req.body.stats_test);
        if ( ! req.body.overall || ! req.body.stats_test ) {
            throw "Missing required parameters in the request";
        }
        //console.log("Call fisher stats stored procedure")
        if ( req.body.stats_test == "fisher test" ) {
            resp = await varPhenStatsSp(db_conn,req.body.overall);
        }
        res.json({"message":resp});
        //console.log(resp);
    } catch(err) {
        next(err)
    }
}



module.exports = {varPhenQuery,varPhenResults,varPhenStats}