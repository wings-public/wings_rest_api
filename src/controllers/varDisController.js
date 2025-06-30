const crypto = require('crypto');
const zlib = require('zlib');
const varDiscServices = require('../services/varDiscServices.js');
const authServices = require('../services/authServices.js');
const indCont = require('../controllers/indController.js');
const {tokenOps} = indCont;
const {centerList,varReqGenSp,varFreqResSp,storeReqDB,getVarDiscReqObj,getHPOParent,getHPOChild,varPhenReqSp,getAdminID,varPhenResultSp,varPhenStatsSp,varContactPISp,varMailSp,varCollabStat,fetchHpoNames,varAssociateReqSp,varAssociateRespSp,fetchHpo} = varDiscServices;
const {getCenter, checkUser} = authServices;

const lodash = require('lodash');

// Function to launch the variant freq query across the different centers
const frequency = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if ( ! req.body.variant || ! req.body.ref_build_type  ) {
            throw "Missing required parameters in the request";
        }

        var variant = req.body.variant;

        var regex = /^[a-z0-9]+\-[0-9]+\-[AGCT]+\-[AGCT]+$/i;
        if ( ! variant.match(regex)) {
            throw "Invalid variant format. Expected chr-pos-ref-alt";
        }

        var assembly_type = req.body.ref_build_type;

        if (['hg19','hg38','GRCh37','GRCh38'].indexOf(assembly_type) < 0 ) {
            //if ( assemblyType != 'hg19' || assemblyType != 'hg38' || assemblyType != 'GRCh37' || assemblyType != 'GRCh38' ) {
                throw "assemblyType: Supported options are hg19/hg38/GRCh37/GRCh38";
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
                // send request to all centers ( all hosts)
                var resp = await varReqGenSp(db_conn,centerObj['CenterID'],centerObj['HostID'],variant,assembly_type);
                //console.log(resp);
                reqObj.push(resp);
            }
        }
        // Function to send variant disc request

        //var filter_result = await getFilterLeaf(user_id,filter_id,db_conn);
        //var samp_req_id = await sampDiscReq(user_id,center_id,host_id,samp_id,file_id,ref_build_type,select_filter,filter_id,db_conn);
    
        // store the response in a table. Return only the auto-incremented ID

        var req_id = await storeReqDB(db_conn,reqObj);
        console.log("Logging the returned request id "+req_id);
        res.json({"message":{"request_id":req_id}});
        //res.json({"message":"success"});

    } catch(err) {
        next(err)
    }
}

// Function to get the trios defined for the family
const frequencyResults = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];


        if ( ! req.query.request_id  ) {
            throw "Missing required parameters in the request";
        }

        // get request object from database
        // function to get the request object list from database

        var reqObjList = await getVarDiscReqObj(db_conn,req.query.request_id);
        console.log("Logging the request object list from database.......");
        console.log(reqObjList);

        //var reqObjList = req.body.request_object;

        //console.log("Logging the request object received as input.....")
        //console.log(reqObjList);

        // Loop 
        var respObj = {'status' : 'inprogress'};
        var inprogress = 0;
        var overallCnt = {'WES' : {'hg19':0,'hg38' : 0}, 'WGS' : {'hg19':0, 'hg38' : 0}};
        var cntObj = {'exp' : '', 'assembly' : '', 'cnt' : 0};
        var data = [];
        var annotation = {};
        // if any of the center has inprogress - then overall status = inprogress
        // if all centers finished - then overall counts has to be cumulated
        // reqObjList - request id from all the centers
        var error = 0;
        for (var i in  reqObjList ) {
            var reqObj = reqObjList[i];
            /*console.log("Logging the request object- loop");
            console.log(reqObj);
            console.log(reqObj['reqId']);
            console.log(reqObj['centerId']);
            console.log(reqObj['hostId']);*/
            if ( reqObj['centerId'] == -1 ) {
                throw "One of the centers has expired token.Cannot proceed.Contact WiNGS Admin Team";
                
            }
            var resp = await varFreqResSp(db_conn,reqObj['reqId'],reqObj['centerId'],reqObj['hostId']);
            //console.log(resp);
            // check status during error
            if (resp['message']['status'] && (resp['message']['status'] == "inprogress")) {
                 inprogress = 1;
            } else if (resp['message']['status'] && (resp['message']['status'] == "completed") ) {
                //console.log("Logging the response object ----");
                //console.log(resp);
                // reformat response object
                //var updObj = await formatObj(resp['Overall']);

                //var updObj = JSON.parse(resp['message']['overall']);
                var updObj = resp['message']['overall'];
                //console.log("Logging the updObj");
                //console.log(updObj);
                data.push(... updObj);
                //var annoObj = JSON.parse(resp['message']['annotation']);
                var annoObj = resp['message']['annotation'];
                if ( annoObj != null ) {
                    //annotation = JSON.parse(resp['message']['annotation']);
                    annotation = resp['message']['annotation'];
                }
            }
            //console.log(resp);
            //reqObj.push(resp);
            
        }

        
        if ( ! inprogress ) {
            respObj['status'] = 'completed';
            console.log("Logging the data array response object ---- ");
            //console.log(respObj);
            const result = cumulateCenterCnt(data, ['exp', 'ref_build']);
            console.log("Logging the overall result ");
            //console.log(result);
            //const result =  cumulateCenterCnt(data, ['exp', 'build']);
            respObj['overall'] = result;
            respObj['annotation'] = annotation;
        }
        // Function to send variant disc request

        //var filter_result = await getFilterLeaf(user_id,filter_id,db_conn);
        //var samp_req_id = await sampDiscReq(user_id,center_id,host_id,samp_id,file_id,ref_build_type,select_filter,filter_id,db_conn);
    
        res.json({"message":respObj});
        //res.json({"message":"success"});

    } catch(err) {
        next(err)
    }
}

// respCnt => { 'WES' : {hg19 : 4, hg38 : 10 } , WGS : {hg19 : 6, hg38 : 20 } }
const formatObj = async(respCnt1) => {
    try {
        //console.log("Logging input in formatObj function");
        //console.log(respCnt1);

        const respCnt = JSON.parse(respCnt1);
        //console.log(respCnt);
        // these are reference build. not experiment. variables to be updated
        var expArr = Object.keys(respCnt);
        //console.log(expArr);
        var cntValArr = [];
        for ( var j in  expArr ) {
            var exp = expArr[j];
            //console.log(exp);
            var valObj = respCnt[exp];
            //console.log(valObj);
            var refBuildArr = Object.keys(valObj);
            //console.log(refBuildArr);
            for ( var k in refBuildArr ) {
                var refB = refBuildArr[k];
                var refCnt = valObj[refB];
                var newObj = {'ref_build' : exp, 'exp' : refB, 'cnt' : refCnt};
                cntValArr.push(newObj);
            }
        }
        return cntValArr;
    } catch(err) {
        throw err;
    }
}

// Function to cumulate values based on multiple keys
const cumulateCenterCnt = (array, keys) => { 
    const groupedData = lodash.groupBy(array, obj => keys.map(key => obj[key]).join('-'));
  
    const result = Object.entries(groupedData).map(([ids, group]) => {
      const compositeKeys = ids.split('-');
  
      const keysObj = keys.reduce((acc, key, index) => {
        acc[key] = compositeKeys[index];
        return acc;
      }, {});
  
      const cumulatedValue = lodash.sumBy(group, 'cnt');
      const sampVal = lodash.sumBy(group, 'sample-size');
      const hetCnt = lodash.sumBy(group, 'het');
      const homAltCnt = lodash.sumBy(group, 'hom-alt');
  
      return {
        ...keysObj,
        cnt: cumulatedValue,
        'sample-size' : sampVal,
        'het' : hetCnt,
        'hom-alt' : homAltCnt,
      };
    });
  
    return result;
  };

// function to get the hpo tree
const hpoTree = async(req,res,next) => {
    try {
         // Fetch the sql connection object
         var db_conn = req.app.locals.db;
         var data = await tokenOps(db_conn,req.token);
         var user_id = data['user_id'];
         var center_id = data['center_id'];
         if ( ! req.body.hpo_id  ) {
            throw "Missing hpo_id in the request";
         }

         var hpoTreeObj = await getHpoTree(req.body.hpo_id,db_conn);

         res.json({"message":hpoTreeObj});
 
    } catch(err) {
        next(err);
    }
}

const getHpoTree = async(hpo_id,db_conn) => {
    try {
        var hpoTreeObj = { 'parent' : {}, 'child' : {}};
         /////////////// PARENT Process #############################
         var retParentObj = await getHPOParent(db_conn,hpo_id);
         // process the returned object 
         // prepareParentObj => target as key, src as parents array

         console.log("Parent Object ---------------------");
         var parentObj = await prepareParentObj(retParentObj,'target','source');
         //console.dir(parentObj,{"depth":null});

         // process parent object and assign levels
         // start with the hpo term of interest

         var parentLevelObj = await prepareParentLevelObj(parentObj,hpo_id);
         
         //console.dir(parentLevelObj,{"depth":null});
         hpoTreeObj['parent'] = parentLevelObj;
         /////////////// PARENT Process #############################


         /////////////// CHILD Process #############################
         var retChildObj = await getHPOChild(db_conn,hpo_id);
         //console.dir(retChildObj);

         // process the returned object 
         // prepareParentObj => target as key, src as parents array

         //console.log("Child Object ---------------------");
         var childObj = await prepareParentObj(retChildObj,'source','target');
         //console.dir(childObj,{"depth":null});

         // process parent object and assign levels
         // start with the hpo term of interest

         var childLevelObj = await prepareParentLevelObj(childObj,hpo_id);
         //console.dir(childLevelObj,{"depth":null});
         /////////////// CHILD Process #############################
         hpoTreeObj['child'] = childLevelObj;
         return hpoTreeObj;

    } catch(err) {
        throw err;
    }
}

// function to get the hpo tree
const hpoTreeFilter = async(req,res,next) => {
    try {
         // Fetch the sql connection object
         var db_conn = req.app.locals.db;
         var data = await tokenOps(db_conn,req.token);
         var user_id = data['user_id'];
         var center_id = data['center_id'];
         if ( ! req.body.hpo_id  || ! req.body.parent_levels || ! req.body.child_levels) {
            throw "Missing parameters in the request";
         }

         var hpo_list = [];
         var hpo_list_parent = [];
         var hpo_list_child = [];
         var hpoTreeObj = await getHpoTree(req.body.hpo_id,db_conn);
         hpo_list_parent = await parseHpoLevels(req.body.parent_levels,'parent',hpoTreeObj);

         hpo_list_child = await parseHpoLevels(req.body.child_levels,'child',hpoTreeObj);

         var hpo_list = hpo_list_parent.concat(hpo_list_child);
        

         res.json({"message":{"hpo_list":hpo_list}});
 
    } catch(err) {
        next(err);
    }
}

const parseHpoLevels = async(total_levels,level_type,hpoTreeObj) => {
    try {
        var hpo_list = [];
        for ( var level=1; level <= total_levels; level++) {
            var hpoTerms = hpoTreeObj[level_type]['levels'][level]
            hpo_list.push(... hpoTerms);
        }
        return hpo_list;
    } catch(err) {
        throw err;
    }
}
const prepareParentLevelObj = async(parentObj,hpo_id) => {
    try {

        // parent for the hpo node of interest
        var hpoPar = parentObj[hpo_id];
        var level = 1;
        var totalSize = Object.keys(parentObj).length;
        //console.log('totalSize '+totalSize);
        //console.log(`level:${level}`);
        //console.log(par);
        //console.log(hpoPar);
        var overallObj = {};
        var parentLevelObj = {};
        parentLevelObj[level] = hpoPar;
        while ( (level < totalSize ) || ( level < 6) ) {
            //hpoPar = parentObj[hpo_id];
            // traverse parent array
            var parObj = [];
            // same level for all the nodes within this loop
            for ( var idx in hpoPar ) {
                var hpoTerm = hpoPar[idx];           
                if ( parentObj[hpoTerm]) {
                    var term1 = parentObj[hpoTerm];

                    // traverse the elements and add to array
                    for ( var idx in term1) {
                        var elem = term1[idx];
                        parObj.push(elem);
                    }
                    
                }
                //console.log(parObj.length);
                
            }

            if ( parObj.length == 0 ) {
                break;
            }
            // get the terms from parObj and create a level 
            // copy parOnj array to hpoPar array
            hpoPar = [];
             // remove duplicates
            let set = new Set(parObj);
            hpoPar = [...set];

            level++
            //hpoPar.push(par);
            // hpoPar , level++ , parents = par
            //console.log(`level:${level}`);
            //console.log(par);
            //console.log(hpoPar);
            parentLevelObj[level] = hpoPar;  
         }
         overallObj['max-level'] = level;
         overallObj['levels'] = parentLevelObj;
         
         return overallObj;
    } catch(err) {
        throw err;
    }
}
const prepareParentObj = async(retParentObj,var1,var2) => {
    try {
        var parentObj = {};
        for ( var idx in retParentObj ) {
            var eachObj = retParentObj[idx];
            var targ = eachObj[var1];
            var src = eachObj[var2];
            // both can be combined. check further..
            if ( parentObj[targ]) {
                // fetch the existing array 
                var existArr = parentObj[targ];
                existArr.push(src);
                // check and remove any duplicates
                let set = new Set(existArr);
                parentObj[targ] = [...set];
                
            } else {
                var arr = [];
                arr.push(src);
                parentObj[targ] = arr;
            }

         }
         return parentObj;
    } catch(err) {

    }
}

// Function to launch the variant freq query across the different centers
const varPhenQuery = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];
        console.log("varPhenQuery------");
        // query_type - 
        if ( ! req.body.query_type || ! req.body.seq_type  || ! req.body.filter_id || ! req.body.ref_build_type || ! req.body.filter_level || ! req.body.hpo_list) {
            throw "Missing required parameters in the request";
        }

        var assembly_type = req.body.ref_build_type;
        var query_type = req.body.query_type;
        var seq_type = req.body.seq_type;
        var filter_level = req.body.filter_level;
        var filter_id = req.body.filter_id;
        var hpo_list = req.body.hpo_list;

        var json_req = {'var_disc' : query_type};
        json_req['var_disc']['hpoList'] = hpo_list;

        //console.log("Logging json request ");
        //console.dir(json_req,{"depth":null});
        

        if (['hg19','hg38','GRCh37','GRCh38'].indexOf(assembly_type) < 0 ) {
            //if ( assemblyType != 'hg19' || assemblyType != 'hg38' || assemblyType != 'GRCh37' || assemblyType != 'GRCh38' ) {
                throw "assemblyType: Supported options are hg19/hg38/GRCh37/GRCh38";
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
                var resp = await varPhenReqSp(db_conn,centerObj['CenterID'],centerObj['HostID'],json_req,assembly_type,seq_type,filter_level,filter_id,admin_id);
                //console.log(resp);
                reqObj.push(resp);
            }
        }
        // Function to send variant disc request

        //var filter_result = await getFilterLeaf(user_id,filter_id,db_conn);
        //var samp_req_id = await sampDiscReq(user_id,center_id,host_id,samp_id,file_id,ref_build_type,select_filter,filter_id,db_conn);
    
        // store the response in a table. Return only the auto-incremented ID

        // convert the hpo_list to hpo_names. hpo_list - array format

        const hpoInClause = arrayToSqlInClause(hpo_list);
        console.log("Logging the transformed clause ");
        console.log(hpoInClause);
        const hpo_res = await fetchHpoNames(db_conn,hpo_list);
        var req_id = await storeReqDB(db_conn,reqObj,hpo_res);
        console.log("Logging the returned request id "+req_id);
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

        // change body to query parameter
        if ( ! req.query.request_id  ) {
            throw "Missing required parameters in the request";
        }

        // get request object from database
        // function to get the request object list from database

        var reqObjList = await getVarDiscReqObj(db_conn,parseInt(req.query.request_id));
        //console.log("Logging the request object list from database.......");
        //console.log(reqObjList);

        //var reqObjList = req.body.request_object;

        //console.log("Logging the request object received as input.....")
        //console.log(reqObjList);

        // Loop 
        var respObj = {'status' : 'inprogress'};
        var inprogress = 0;
        
        var data = [];
        // if any of the center has inprogress - then overall status = inprogress
        // if all centers finished - then overall counts has to be cumulated
        // reqObjList - request id from all the centers
        var error = 0;
        var res_obj_overall = {};
        
        for (var i in  reqObjList ) {
            var reqObj = reqObjList[i];
            /*console.log("Logging the request object- loop");
            console.log(reqObj);
            console.log(reqObj['reqId']);
            console.log(reqObj['centerId']);
            console.log(reqObj['hostId']);*/
            if ( reqObj['centerId'] == -1 ) {
                throw "One of the centers has expired token.Cannot proceed.Contact WiNGS Admin Team";
                
            }
            var resp = await varPhenResultSp(db_conn,reqObj['reqId'],reqObj['centerId'],reqObj['hostId']);
            //console.log(resp);
   
            // check status during error
            if ( resp['status'] && (resp['status'] == "inprogress")) {
                 inprogress = 1;
            } else if (resp['status'] && (resp['status'] == "completed") ) {
                //console.log("Logging the response object ----");
                //console.log(resp);
                var tmpCentId = reqObj['centerId'];
                res_obj_overall[tmpCentId] = resp;
                console.log("Logging the object from center ---- ");
                console.dir(res_obj_overall,{"depth":null});
                // reformat response object
                //var updObj = await formatObj(resp['Overall']);
                //console.log(updObj);
                //data.push(... updObj);
            } else if (resp['status'] && (resp['status'] == "no-variants" || resp['status'] == "expired") ) {
                var tmpCentId = reqObj['centerId'];
                //console.log(tmpCentId);
                res_obj_overall[tmpCentId] = resp;
                //console.dir(res_obj_overall,{"depth":null});
            }
            //console.log(resp);
            //reqObj.push(resp);
            
        }

        //console.log("Logging this object ---------");
        //console.dir(res_obj_overall,{"depth":null});
        var variantCntAnnObj = {};
        var varCntObj = {};
        var overallFreqObj = {'var+phen': 0, 'var-phen': 0, '-var+phen': 0, '-var-phen': 0};
        if ( ! inprogress ) {
            //respObj['status'] = 'completed';
            //console.log("Logging the data array ---- ");
            //console.log(data);
            // Loop res_obj_overall 
            // Get the center keys 
            var centers = Object.keys(res_obj_overall);
            var center_total = centers.length;
            var novar_center_count = 0;
            //console.log(centers);
            // loop each center
            for ( var idx in centers ) {
                var cID = centers[idx];
                
                //console.log("logging center id ");
                //console.log(cID);
                if (res_obj_overall[cID]['status'] == 'expired' ) {
                    respObj['status'] = 'expired';
                    // need not process further
                    break;
                } else if(res_obj_overall[cID]['status'] == 'no-variants' ) { 
                    // no results - variants
                    ++novar_center_count;
                    //respObj['status'] = 'no-variants';
                    console.log("Setting status to no variants ");
                    // skip this center
                    continue;
                } else if (res_obj_overall[cID]['status'] == 'completed' ) {
                    respObj['status'] = 'completed';
                    console.log("Setting status to completed ------- ");
                    var variants = Object.keys(res_obj_overall[cID]['documents']);
                    console.log("Logging variants ");
                    console.dir(variants,{"depth":null});
                    for ( const [i,v] of variants.entries()) {
                        if ( v == 'status') {
                            continue;
                        }
                        //console.log("loop traversal")
                        //console.log(i);
                        //console.log(v);
                        if (  variantCntAnnObj.v == undefined ) {
                            //console.log("Inside variant check")
                            //console.dir(res_obj_overall[cID]['documents'][v]['annotations'],{"depth":null});
                            variantCntAnnObj[v] = res_obj_overall[cID]['documents'][v]['annotations'];
                        }

                        // check and sum up counts
                        // don't cumulate variant counts. fetch from overall
                        var currCntObj = res_obj_overall[cID]['documents'][v]['counts'];
                        if ( varCntObj.v == undefined ) {
                            varCntObj[v] = currCntObj;
                        } else {
                            // fetch and cumulate counts
                            // current counts 
                            //var currCntObj = res_obj_overall[cID]['documents'][v]['counts'];
                            var storedCnt = varCntObj[v];
                            varCntObj[v]['var+phen'] = currCntObj['var+phen'] + varCntObj[v]['var+phen'];
                            varCntObj[v]['var-phen'] = currCntObj['var-phen'] + varCntObj[v]['var-phen'];
                            varCntObj[v]['-var+phen'] = currCntObj['-var+phen'] + varCntObj[v]['-var+phen'];
                            varCntObj[v]['-var-phen'] = currCntObj['-var-phen'] + varCntObj[v]['-var-phen'];
                            
                            // store the cumulated counts
                        }
                        /*overallFreqObj['var+phen'] = overallFreqObj['var+phen'] + currCntObj['var+phen'];
                        overallFreqObj['var-phen'] = overallFreqObj['var-phen'] + currCntObj['var-phen'];
                        overallFreqObj['-var+phen'] = overallFreqObj['-var+phen'] + currCntObj['-var+phen'];
                        overallFreqObj['-var-phen'] = overallFreqObj['-var-phen'] + currCntObj['-var-phen'];*/
                    }
                    var currCntObjO = res_obj_overall[cID]['documents']['overall'];
                    // store the overall values here
                    overallFreqObj['var+phen'] = overallFreqObj['var+phen'] + currCntObjO['var+phen'];
                    overallFreqObj['var-phen'] = overallFreqObj['var-phen'] + currCntObjO['var-phen'];
                    overallFreqObj['-var+phen'] = overallFreqObj['-var+phen'] + currCntObjO['-var+phen'];
                    overallFreqObj['-var-phen'] = overallFreqObj['-var-phen'] + currCntObjO['-var-phen'];

                } else {
                    // any error conditions to be checked
                }
                /*for ( var obj in Object.keys(res_obj_overall[cID]['documents'])) {
                    console.dir(obj,{"depth":null});
                    var variant = Object.keys(obj);
                    console.log(variant);
                }*/
            } // centers loop
            // update status as no-variants only if all the centers have it.Otherwise it would replace completed status
            if (center_total == novar_center_count) {
                respObj['status'] = 'no-variants';
            }


            //const result =  cumulateCenterCnt(data, ['exp', 'ref_build']);
            // scan the documents and process the object
            //respObj['overall'] = res_obj_overall;
        } else {

        }
        respObj['annotations'] = variantCntAnnObj;
        respObj['variant-counts'] = varCntObj;
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

// Sample asynchronous function (simulate an async operation)
const simulateAsyncOperation = async (value) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(value * 2);
    }, 1000);
  });
};

// Function to get the PIID based on the variant and contact PI 
const varPhenCollab = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];


        if ( ! req.body.request_id  || ! req.body.variant ) {
            throw "Missing required parameters in the request";
        }

        // get request object from database
        // function to get the request object list from database

        var reqObjList = await getVarDiscReqObj(db_conn,req.body.request_id);
        console.log("Logging the request object list from database.......");
        console.log(reqObjList);

        // Loop 
        var data = [];
        var annotation = {};
        // if any of the center has inprogress - then overall status = inprogress
        // if all centers finished - then overall counts has to be cumulated
        // reqObjList - request id from all the centers
        var error = 0;
        var PIIDArr = [];
        for (var i in  reqObjList ) {
            var reqObj = reqObjList[i];
            /*console.log("Logging the request object- loop");
            console.log(reqObj);
            console.log(reqObj['reqId']);
            console.log(reqObj['centerId']);
            console.log(reqObj['hostId']);*/
            if ( reqObj['centerId'] == -1 ) {
                throw "One of the centers has expired token.Cannot proceed.Contact WiNGS Admin Team";
                
            }

            // get the admin id 
            var admin_id = await getAdminID(db_conn,reqObj['centerId'],reqObj['hostId']);

            // Contact each center and get the list of PIID
            var req_type = "discovery";
            if (req.path.match(/association/)) {
                req_type = "association";
            }
            var resp = await varContactPISp(db_conn,reqObj['reqId'],reqObj['centerId'],reqObj['hostId'], req.body.variant,admin_id,req_type);
            //console.log(resp);
            // check status during error
            if ( req.body.test_piid || resp['PIID'] ) {
                 // check if PIID is defined
                 // If PIID is defined , trigger the stored procedure to send e-mail
                 console.log(resp['PIID']);
                 console.log(resp['centerId']);
                 console.log(resp['hostId']);
                 var piid = null;
                 if ( req.body.test_piid ) {
                    // contact center
                    piid = req.body.test_piid
                 } else {
                    piid = resp['PIID'];
                 }
                 // generate token for the specific piid and center id
                 // Trigger the stored procedure that will invoke the API to send mail.
                 // central_req_id -> Request id that is common, not specific to center. 
                var jsonReq1 = { "type": "Mail", "req_user_id": user_id, "central_req_id": req.body.request_id, "reqid": reqObj['reqId'], "piid": piid, "variant": req.body.variant, "user": user_id };
                console.dir(jsonReq1, {"depth":null});
                 var jsonReq = JSON.stringify(jsonReq1);
                 await varMailSp(db_conn,jsonReq,reqObj['centerId'],reqObj['hostId'],user_id);

                 PIIDArr.push(piid);  

            } 
            //console.log(resp);
            //reqObj.push(resp);
            
        }

        res.json({"message":{"status":"requested", "id":PIIDArr}});
        //res.json({"message":"success"});

    } catch(err) {
        next(err)
    }
}

const varPhenCollabManage = async(req,res,next) => {
    try {
        // Decode URL components
        const encryptedData = decodeURIComponent(req.query.data);
        const iv = decodeURIComponent(req.query.iv);
        var db_conn = req.app.locals.db;

        console.log(encryptedData);
        console.log(iv);

        const fixedText = 'collabwingscenter128'; // Should be 16 bytes
        const secretKey = crypto.createHash('sha256').update(fixedText).digest().slice(0, 16);

        // Decrypt the data
        const decryptedJson = decryptJson({ data: encryptedData, iv: iv }, secretKey);
        console.log('Decrypted:', decryptedJson);

        // check and validate the piid and center_id
        // decrypted - {"center_id" : center_id, "req_id" : request_id, "piid" : piid};
        if ( ! decryptedJson['center_id']  || ! decryptedJson['req_id'] || ! decryptedJson['piid']) {
            throw "Invalid decrypted request. Cannot proceed further"
        }

        // Validate center id and other params
        var result = await getCenter(decryptedJson['piid'],db_conn);
        var user_info = await checkUser(decryptedJson['piid'],decryptedJson['center_id'],db_conn);
        // generate token for center_id and piid
        
        // Validated - proceed further and update status

        var status = "";
            
        if ( req.url.match(/approve/g) ) {
            status = "approved";
        } else if ( req.url.match(/reject/g) ) {
            status = "rejected";
        }

        // Call stored procedure with these params
        var jsonReq1 = {"type": "Update", "reqid": decryptedJson['req_id'], "piid": decryptedJson['piid'], "status" : status};
        var jsonReq = JSON.stringify(jsonReq1);
        // temp fix - static host_id 
        var tmp_host_id = 1;
        await varMailSp(db_conn,jsonReq,decryptedJson['center_id'],tmp_host_id,decryptedJson['piid']);
        decryptedJson['status'] = 'updated';
        res.json({"message":decryptedJson});

    } catch(err) {
        next(err)
    }

}

// Function to launch the genotype - phenotype association query across all the centers
const associationReq = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];
        console.log("varPhenQuery------");
        // query_type - 
        if ( ! req.body.genotype || ! req.body.phenotype || ! req.body.seq_type  || ! req.body.ref_build_type ) {
            throw "Missing required parameters in the request";
        }

        var assembly_type = req.body.ref_build_type;
        var variant = req.body.genotype.variant;
        var hpo = req.body.phenotype.hpo_term;
        var seq_type = req.body.seq_type;

        //console.log("Logging json request ");
        //console.dir(json_req,{"depth":null});
        

        if (['hg19','hg38','GRCh37','GRCh38'].indexOf(assembly_type) < 0 ) {
            //if ( assemblyType != 'hg19' || assemblyType != 'hg38' || assemblyType != 'GRCh37' || assemblyType != 'GRCh38' ) {
                throw "assemblyType: Supported options are hg19/hg38/GRCh37/GRCh38";
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
                var resp = await varAssociateReqSp(db_conn,centerObj['CenterID'],centerObj['HostID'],variant,hpo,assembly_type,seq_type);
                //console.log(resp);
                reqObj.push(resp);
            }
        }
        
    
        // store the response in a table. Return only the auto-incremented ID
        var hpo_res = [];
        hpo_res.push(hpo);
        var req_id = await storeReqDB(db_conn,reqObj,hpo_res);
        console.log("Logging the returned request id "+req_id);
        res.json({"message":{"request_id":req_id}});
        //res.json({"message":"success"});

    } catch(err) {
        next(err)
    }
}


// Function to get the genotype - phenotype association results
const associationResults = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        // change body to query parameter
        if ( ! req.query.request_id  ) {
            throw "Missing required parameters in the request";
        }

        // get request object from database
        // function to get the request object list from database

        var reqObjList = await getVarDiscReqObj(db_conn,parseInt(req.query.request_id));
        //console.log("Logging the request object list from database.......");
        //console.log(reqObjList);

        //var reqObjList = req.body.request_object;

        //console.log("Logging the request object received as input.....")
        //console.log(reqObjList);

        // Loop 
        var respObj = {'status' : 'inprogress'};
        var inprogress = 0;
        
        var data = [];
        // if any of the center has inprogress - then overall status = inprogress
        // if all centers finished - then overall counts has to be cumulated
        // reqObjList - request id from all the centers
        var error = 0;
        var res_obj_overall = {};
        
        for (var i in  reqObjList ) {
            var reqObj = reqObjList[i];
            /*console.log("Logging the request object- loop");
            console.log(reqObj);
            console.log(reqObj['reqId']);
            console.log(reqObj['centerId']);
            console.log(reqObj['hostId']);*/
            if ( reqObj['centerId'] == -1 ) {
                throw "One of the centers has expired token.Cannot proceed.Contact WiNGS Admin Team";
                
            }
            var resp = await varAssociateRespSp(db_conn,reqObj['reqId'],reqObj['centerId'],reqObj['hostId']);
            //console.log(resp);
   
            // check status during error
            if ( resp['st'] && (resp['st'] == "inprogress")) {
                 inprogress = 1;
            } else if (resp['st'] && (resp['st'] == "completed") ) {
                //console.log("Logging the response object ----");
                //console.log(resp);
                var tmpCentId = reqObj['centerId'];
                res_obj_overall[tmpCentId] = resp;
                console.log("Logging the object from center ---- ");
                console.dir(res_obj_overall,{"depth":null});
                // reformat response object
                //var updObj = await formatObj(resp['Overall']);
                //console.log(updObj);
                //data.push(... updObj);
            } else if (resp['st'] && (resp['st'] == "no-variants" || resp['st'] == "expired") ) {
                var tmpCentId = reqObj['centerId'];
                //console.log(tmpCentId);
                res_obj_overall[tmpCentId] = resp;
                //console.dir(res_obj_overall,{"depth":null});
            }
            //console.log(resp);
            //reqObj.push(resp);
            
        }

        //console.log("Logging this object ---------");
        //console.dir(res_obj_overall,{"depth":null});
        var variantCntAnnObj = {};
        var varCntObj = {};
        var overallFreqObj = {'var+phen': 0, 'var-phen': 0, '-var+phen': 0, '-var-phen': 0};
        var overall_defined  = 0;
        if ( ! inprogress ) {
              
            //respObj['status'] = 'completed';
            //console.log("Logging the data array ---- ");
            //console.log(data);
            // Loop res_obj_overall 
            // Get the center keys 
            var centers = Object.keys(res_obj_overall);
            //console.log(centers);
            // loop each center
            for ( var idx in centers ) {
                var cID = centers[idx];
                //console.log("logging center id ");
                //console.log(cID);
                if (res_obj_overall[cID]['st'] == 'expired' ) {
                    respObj['status'] = 'expired';
                    // need not process further
                    break;
                } else if(res_obj_overall[cID]['st'] == 'no-variants' ) { 
                    // no results - variants
                    respObj['status'] = 'no-variants';
                    // skip this center
                    continue;
                } else if (res_obj_overall[cID]['st'] == 'completed' ) {
                    respObj['status'] = 'completed';
                    var currCntObjO = JSON.parse(res_obj_overall[cID]['Overall']);
                    overall_defined = 1;
                    // store the overall values here
                    // client api and the sp displays the correlation with the keys used in currCntObjO
                    overallFreqObj['var+phen'] = overallFreqObj['var+phen'] + currCntObjO['variant-phenotype'];
                    overallFreqObj['var-phen'] = overallFreqObj['var-phen'] + currCntObjO['variant-no-phenotype'];
                    overallFreqObj['-var+phen'] = overallFreqObj['-var+phen'] + currCntObjO['no-variant-phenotype'];
                    overallFreqObj['-var-phen'] = overallFreqObj['-var-phen'] + currCntObjO['no-variant-no-phenotype'];

                } else {
                    // any error conditions to be checked
                }
                /*for ( var obj in Object.keys(res_obj_overall[cID]['documents'])) {
                    console.dir(obj,{"depth":null});
                    var variant = Object.keys(obj);
                    console.log(variant);
                }*/
            } // centers loop


            //const result =  cumulateCenterCnt(data, ['exp', 'ref_build']);
            // scan the documents and process the object
            //respObj['overall'] = res_obj_overall;
        } else {

        }
        
        respObj['overall'] = overallFreqObj;
        var stat_resp = null;
        if ( overall_defined ) {
            stat_resp = await varPhenStatsSp(db_conn,respObj['overall']);
        }
        respObj['fisher-exact'] = stat_resp;
        // also include statistical call . 
    
        res.json({"message":respObj});
        //res.json({"message":"success"});

    } catch(err) {
        next(err)
    }
}


// Function to convert the hpo id to hpo term
const hpoConvert = async (req, res, next) => {
    try {
        // Fetch the sql connection object
        var resp = "";
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn, req.token);
        //console.log(data);
        //console.log("varPhenStats --- ")
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if (!req.query.hpo_id && !req.query.hpo_term) {
            throw "Missing required parameters in the request";
        }
        var hpo_list = "";
        var type = "";
        if (req.query.hpo_id) {
            hpo_list = req.query.hpo_id.split(',');
            type = "hpoid";
        } else if (req.query.hpo_term) {
            hpo_list = req.query.hpo_term.split(',');
            type = "hpoterm";
        }

        console.log(hpo_list)
        const hpo_res = await fetchHpo(db_conn, hpo_list, type);
        //resp = await hpoTable(db_conn,hpo_id);

        res.json({ "message": hpo_res });
        //console.log(resp);
    } catch (err) {
        next(err);
    }
}

// URL-safe Base64 decoding
function base64UrlDecode(base64Url) {
    let base64 = base64Url
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return Buffer.from(base64, 'base64');
}

function decryptJson(encryptedObject,secretKey) {
    const iv = Buffer.from(encryptedObject.iv, 'hex');
    const encryptedText = base64UrlDecode(encryptedObject.data);
    //const encryptedText = Buffer.from(encryptedObject.data, 'base64url');
    const decipher = crypto.createDecipheriv('aes-128-cbc', secretKey, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    const decompressed = decompress(decrypted);
    return JSON.parse(decompressed.toString());
}

function decompress(data) {
    return zlib.gunzipSync(data);
}

// Function to get the PIID based on the variant and contact PI 
const varPhenCollabStatus = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if ( ! req.query.request_id  ) {
            throw "Missing required parameters in the request";
        }

        var collabRes = await varCollabStat(user_id,parseInt(req.query.request_id),db_conn);
        var approved = [];
        var rejected_centers = 0;
        for (var i in  collabRes ) {
            var collabResObj = collabRes[i];
            console.dir(collabResObj,{"depth":null});
            if ( collabResObj['Status'] == "rejected"  ) {
                rejected_centers++;
            } else if (collabResObj['Status'] == "approved") {
                var approvedObj = {'piid' : collabResObj['PIID']};
                approved.push(approvedObj);
            }
        }
        var collabResOverall = {'approved': approved, 'rejected' : rejected_centers}
        //console.log(collabRes)
        //console.dir(collabRes.recordset,{"depth":null});
        res.json({"message":collabResOverall});
    } catch(err) {
        next(err)
    }
}

function arrayToSqlInClause(arr) {
    // Convert each element to a string and wrap it in single quotes
    const quotedElements = arr.map(item => `'${item}'`);
    // Join the quoted elements with commas
    return quotedElements.join(', ');
}

module.exports = {frequency,frequencyResults,hpoTree,varPhenQuery,varPhenResults,varPhenStats,hpoTreeFilter,varPhenCollab,varPhenCollabManage,varPhenCollabStatus,associationReq, associationResults,hpoConvert}