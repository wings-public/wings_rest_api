const authServices = require('../services/authServices.js');
const indServices = require('../services/indServices.js');

const {decodePayload,centerApiToken,getCenter} = authServices
const {getIndividuals,processResult,prepareIndData,editIndividual,getIndPhenotype,getFamilies,processFamResult,getPiid,omitKeys,addNewFamily,getMemberType,getMemberID,getUnassignedMem,assignProband,assignFamMember,addPhenotype,deletePhenotype,validatePhenTerm,checkIndGender,getTrios,getTrioFilter,getFilterLeaf,trioInheritReq,trioInheritResp,addPedigree,getFamAnalysisOpts,triggerPreProcessReq,famPreprocessStatSp,familyFilterQuerySp,SVResultsQuery,unassignRelative} = indServices;
// Validates the request object and sends the request to services
// 1. All PI and and all Individuals for which the user has access.
const individuals = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        var piid = -1; // default setting
        var ind_id = -1;
        var ind_hpo = {};
        // When the piid is provided as query parameter
        if ( req.query.piid ) {
            piid = req.query.piid
        // When the individual id is provided as query parameter
        } else if ( req.params.indId ) {
            ind_id = parseInt(req.params.indId)
            //console.log(ind_id)
            // execute function to get the hpo added to individual
            ind_hpo = await getIndPhenotype(user_id,center_id,ind_id,db_conn)
            //console.log(ind_hpo)
        } 
        var ind_result = await getIndividuals(user_id,center_id,piid,ind_id,db_conn);
        // Function to process the result and send response
        if ( req.method == "PUT" ) {
            //console.log("Include code for editing Individual");
            var upd_result = await prepareIndData(ind_result,req.body)
            var status = await editIndividual(user_id,center_id,piid,ind_id,upd_result,db_conn);
            res.json({"message":"success"});
        } else {
            var upd_result = await processResult(ind_result,ind_hpo)
            res.json({"message":upd_result});
        }
        
    } catch(err) {
        next(err)
    }
}

// Validates the request object and sends the request to services
// 1. All PI and and all families for which the user has access.
const families = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        var piid = -1; // for testing purpose
        var fam_id = -1;
        const regex_ind = /\d+/g
        var ind_hpo = {}
        var proband = null;
        // When the piid is provided as query parameter
        if ( req.query.piid ) {
            piid = req.query.piid
            //console.log("PIID passed as argument is "+piid)
        // When the individual id(proband) is provided as query parameter
        } else if ( req.query.proband ) {
            proband = req.query.proband
            //console.log("proband "+proband)
        } else if ( req.params.famId ) {
            fam_id = parseInt(req.params.famId)
            //console.log("FamilyID is "+fam_id)
        } 
        
        if ( req.query.piid && req.query.proband) {
            throw "Invalid: API_URL/families?piid=piid&proband=proband.Filter with ?piid OR ?proband"
        }
        var fam_result = await getFamilies(user_id,center_id,piid,fam_id,db_conn);
        //console.dir(fam_result,{"depth":null})
        // Function to process the result and send response
        //console.log("Printing method type "+req.method)
    
        var upd_result = await processFamResult(fam_result,proband)
        if ( upd_result == undefined && req.query.proband ) {
            upd_result = {}
        }
        //console.log("Logging result from processfm")
        //console.dir(upd_result,{"depth":null})
        res.json({"message":upd_result});
          
    } catch(err) {
        const re = /System.ArgumentNullException: Value cannot be null/g;
        //console.log("*************************************")
        //console.log(err)
        var err_msg = err.message || err;
        if ( err_msg.match(re) ) {
            err = "familyID is not defined in WiNGS system";
        }
        next(err)
        //next(err)
    }
}

// Retrives center id, user_id from token and sends request to refresh the external API token
const tokenOps = async(db_conn,token) => {
    try {
        var data = {'user_id' : 0, 'center_id' : 0}
        // services Function : Fetch the user id and center id from token
        var user_id = await decodePayload(token)
        var result1 = await getCenter(user_id,db_conn)
        var center_id = result1.recordset[0].CenterID || null
        //console.log("user_id"+user_id)
        //console.log("center_id"+center_id)

        // Function to call sp to get the token for external center API
        var token_type = process.env.TOK_LOGIN
        var new_center_id = -1
        var tok_host_type = process.env.TOK_HOST_TYPE
        // Refresh center/external API token
        await centerApiToken(user_id,center_id,token_type,new_center_id,tok_host_type,db_conn);
        data['user_id'] = user_id;
        data['center_id'] = center_id;
        return data;
    } catch(err) {
        throw err;
    }
}
// Function to create a new family
const createFamily = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if ( ! req.body.family_desc || ! req.body.host_id || ! req.body.piid ) {
            next("Missing request body parameters")
        }

        var piid = req.body.piid;
        // Validate the piid 
        var family_desc = req.body.family_desc;
        var host_id = req.body.host_id;
        // validate the host id

        var resp = await addNewFamily(piid,family_desc,host_id,user_id,center_id,db_conn)
        res.json({"message":{'family_id':resp}});
          
    } catch(err) {
        next(err)
    }
}


// Function to get the piid for which the user has access
const piidExec = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        var sp_result = await getPiid(center_id,user_id,db_conn);
        var pi_result = await omitKeys(sp_result,['DefDsID','UserType','UserActive'])
        res.json({"message":pi_result});
    } catch(err) {
        next(err)
    }
}


// Function to get the different member types in a family
const membertype = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        var mem_result = await getMemberType(db_conn);
        
        res.json({"message":mem_result});
    } catch(err) {
        next(err)
    }
}

// Function to get the unassigned members which can be assigned to family
const unassignedMembers = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];
        
        if ( ! req.body.host_id  || ! req.body.piid ) {
            throw "host_id and piid required in request body"
        }
        if ( req.query.type ) {
            var mem_type = req.query.type;
            // Validate the member type

            var mem_id = await getMemberID(mem_type,db_conn)
            var unassigned_mem = await getUnassignedMem(req.body.piid,req.body.host_id,mem_id,user_id,center_id,db_conn);
            res.json({"message":unassigned_mem});
        } else {

        }
    } catch(err) {
        next(err)
    }
}

// Function to validate the input and triggers function to assign proband/members to family
const assignMembers = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        // Validate the request body for this route
        if ( ! req.body.family_id || ! req.body.ind_id || ! req.body.host_id ) {
            throw "Missing required request body parameters - family_id, ind_id, host_id"
        }

        if ( req.query.type ) {
            var mem_type = req.query.type;
            var family_id = req.body.family_id;
            var ind_id = req.body.ind_id
            var host_id = req.body.host_id;

            // check if family exists
            var piid = -1;
            var res1 = await getIndividuals(user_id,center_id,piid,ind_id,db_conn);
            //console.log("Logging details of getIndividuals ");
            //console.dir(res1,{"depth":null});

            // Check if individual exists
            var res2 = await getFamilies(user_id,center_id,piid,family_id,db_conn);
            //console.log("Logging the details of getFamilies");
            //console.dir(res2,{"depth":null}); 

            if ( mem_type == "Proband" ) {
                // call the services function to assign the proband
                var resp = await assignProband(user_id,center_id,db_conn,family_id,ind_id,host_id);
                if ( resp != "Success") {
                    res.json({"message": resp});  
                } else {
                    // Proceed to setup pedigree with Father and Mother
                    var members = ['Father','Mother']
                    await addPedigree(user_id,center_id,db_conn,family_id,host_id,members)
                    res.json({"message": "success"});  
                }
                //res.json({"message":"assign proband function"});                
            } else if ( mem_type == "Father" || mem_type == "Mother" ) {
                // Based on the member type, also validate the Gender on the Individual. Otherwise throw error.
                var status = await checkIndGender(mem_type,user_id,center_id,piid,ind_id,db_conn);
                if ( ! status ) {
                    next(`Gender of ${ind_id} does not match for ${mem_type}`)
                } else {
                    var resp = await assignFamMember(user_id,center_id,db_conn,family_id,ind_id,host_id,mem_type);
                    res.json({"message": "success"});  
                }
            } else {
                next(`Member Type ${mem_type} not yet supported for this endpoint`)
            } 
        } else {
            throw "type query parameter - required for this API"
        }
    } catch(err) {
        const re = /System.ArgumentNullException: Value cannot be null/g;
        //console.log(err)
        var err_msg = err.message || err;
        if ( err_msg.match(re) ) {
            err = "familyID is not defined in WiNGS system";
        }
        next(err)
    }
}

// Function to validate the input and triggers function to unassign members from a family
const unassignMembers = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        // Validate the request body for this route
        if ( ! req.body.family_id || ! req.body.ind_id || ! req.body.host_id ) {
            throw "Missing required request body parameters - family_id, ind_id, host_id"
        }

        if ( req.query.type ) {
            var mem_type = req.query.type;
            var family_id = req.body.family_id;
            var ind_id = req.body.ind_id
            var host_id = req.body.host_id;

            // check if family exists
            var piid = -1;
            var res1 = await getIndividuals(user_id,center_id,piid,ind_id,db_conn);
            console.log("Logging details of getIndividuals ");
            console.dir(res1,{"depth":null});

            // Check if individual exists
            var res2 = await getFamilies(user_id,center_id,piid,family_id,db_conn);
            console.log("Logging the details of getFamilies");
            console.dir(res2,{"depth":null}); 

            if ( mem_type == "Father" || mem_type == "Mother" ) {
                // Based on the member type, also validate the Gender on the Individual. Otherwise throw error.
                var status = await checkIndGender(mem_type,user_id,center_id,piid,ind_id,db_conn);
                if ( ! status ) {
                    next(`Gender of ${ind_id} does not match for ${mem_type}`)
                } else {

                    // Step1 - unassign relative
                    var resp = await unassignRelative(user_id,center_id,db_conn,family_id,host_id,mem_type,ind_id);

                    //Step2 - remove the ind id from the pedigree
                    // send the ind_id as null
                    var tmp_ind_id = null;
                    var resp = await assignFamMember(user_id,center_id,db_conn,family_id,tmp_ind_id,host_id,mem_type);
                    res.json({"message": "success"});  
                }
            } else {
                next(`Member Type ${mem_type} not yet supported for this endpoint`)
            } 
        } else {
            throw "type query parameter - required for this API"
        }
    } catch(err) {
        const re = /System.ArgumentNullException: Value cannot be null/g;
        //console.log(err)
        var err_msg = err.message || err;
        if ( err_msg.match(re) ) {
            err = "familyID is not defined in WiNGS system";
        }
        next(err)
    }
}

// Function to validate request body and add/delete HPO term
const editPhenotype = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if ( ! req.body.host_id  || ! req.body.ind_id || ! req.body.hpo_id || ! req.body.hpo_status ) {
            throw "Missing required request body parameters"
        }

        var host_id = req.body.host_id;
        var ind_id = req.body.ind_id;
        var hpo_id = req.body.hpo_id;
        var hpo_status = req.body.hpo_status;

        var status = await validatePhenTerm(db_conn,hpo_id);
        if ( ! status ) {
            throw "Invalid HPO Term"
        }

        if ( req.method == "POST" ) {
            await addPhenotype(db_conn,user_id,center_id,host_id,ind_id,hpo_id,hpo_status);
        } else if ( req.method == "DELETE" ) {
            await deletePhenotype(db_conn,user_id,center_id,host_id,ind_id,hpo_id,hpo_status);
        }
        res.json({"message": "success"});  
    } catch(err) {
        next(err)
    }
}

// Function to get the trios defined for the family
const trios = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        var family_id = "";
        var piid = -1;
        if ( ! req.query.family ) {
            throw "family id required to fetch trios"
        }
        family_id = req.query.family;
        var registered = 1;

        var fam_result = await getTrios(user_id,center_id,piid,family_id,registered,db_conn);
        if ( fam_result ) {
            fam_result = await omitKeys(fam_result,['ReferenceBuildID'])
        }
    
        //var upd_result = await processFamResult(fam_result,proband)
        res.json({"message":fam_result});

    } catch(err) {
        next(err)
    }
}

// Function to get the trio filters
const trioFilter = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        console.log(req.path);
        var req_path = req.path;

        const re = /System.ArgumentNullException: Value cannot be null/g;
        
        var analysis_type = "";
        if ( req_path.match(/samples/) ) {
            analysis_type = process.env.SAMP_ANAL_TYPE
            console.log(analysis_type);
        } else if ( req_path.match(/trio/) || req_path.match(/families/) ) {
            analysis_type = process.env.TRIO_ANAL_TYPE;
            console.log(analysis_type);
        } else if ( req_path.match(/variant/) ) {
            analysis_type = process.env.VAR_DISC_ANAL_TYPE;
            console.log(analysis_type);
        }

        // Analysis defined in Tbl_GAP_Filter for Trio based filters.
        //var analysis_type = 'B';
        var filter_result = await getTrioFilter(user_id,analysis_type,db_conn);
        if ( filter_result ) {
            filter_result = await omitKeys(filter_result,['UserID','Type','AnalysisType']);
        }
        
        //var upd_result = await processFamResult(fam_result,proband)
        res.json({"message":filter_result});

    } catch(err) {
        next(err)
    }
}

// Function to get the trios defined for the family
const trioFilterLeaf = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if ( ! req.body.filter_id ) {
            throw "Missing filter_id in the request"
        }

        var filter_id = req.body.filter_id;
        
        var filter_result = await getFilterLeaf(user_id,filter_id,db_conn);
    
        res.json({"message":filter_result});

    } catch(err) {
        next(err)
    }
}


// Function to get the trios defined for the family
const trioInherit = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if ( ! req.body.type  || ! req.body.filter_id || ! req.body.trio_local_id || ! req.body.filter_level ) {
            throw "Missing required parameters in the request";
        }

        var inherit_type = req.body.type;
        var filter_id = req.body.filter_id;
        var trio_local_id = req.body.trio_local_id;
        var select_filter = req.body.filter_level;
        
        //var filter_result = await getFilterLeaf(user_id,filter_id,db_conn);
        var inherit_req = await trioInheritReq(user_id,center_id,select_filter,filter_id,trio_local_id,inherit_type,db_conn);
    
        res.json({"message":{"request_id":inherit_req}});
        //res.json({"message":"success"});

    } catch(err) {
        next(err)
    }
}


// Function to get the trios defined for the family
// adapting the function for trio local id and also sample local id
const trioInheritResult = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];
        var tmp_host_id = 0;

        // trio requests will send local id as trio_local_id
        // sample disc requests will send as local_id
        // to be changed with req.query.trio_local_id and so on 
        if ( (! req.query.trio_local_id && ! req.query.local_id && ! req.query.family_local_id ) || ! req.query.request_id ) {
            throw "Missing required parameters in the request";
        }

        // family based requests
        if ( req.query.host_id ) {
            tmp_host_id = parseInt(req.query.host_id);
        }

        var local_id = "";
        // change with req.query
        if ( req.query.trio_local_id) {
            local_id = req.query.trio_local_id;
        } else if ( req.query.local_id ) {
            local_id = req.query.local_id;
        } else if ( req.query.family_local_id ) {
            local_id = req.query.family_local_id;
        }

        //var trio_local_id = req.body.trio_local_id;
        // change with req.query
        var request_id = parseInt(req.query.request_id);

        var page_num = 1;
        if ( req.query.page ) {
            page_num = parseInt(req.query.page);
        } 
        
        //var filter_result = await getFilterLeaf(user_id,filter_id,db_conn);
        var inherit_resp = await trioInheritResp(user_id,center_id,local_id,request_id,page_num,db_conn,tmp_host_id);

        var results = {};
        var meta =  {'current_page' : "", 
                      'next_page' : "", 
                       'last_page' : ""};
    
        if ( 'batch' in inherit_resp && 'lastBatch' in inherit_resp ) {
            //const host = req.headers['x-forwarded-host'] || req.headers.host;
            // host based on headers gives localhost
            const host = process.env.APP_URL; // updated
            //var full_url = req.protocol + '://' + req.get('host') + req.originalUrl;
            //var full_url = req.protocol + '://' + host + req.originalUrl;
            // protocol not needed as APP_URL has protocol
            var full_url = host + req.originalUrl;
            
            var next_p_num = inherit_resp['batch'] + 1;
            meta['last_page'] = "false";
           
            //console.log("***************************************");
            //console.log(full_url)
            // 'batch' , 'lastBatch' values to be retrieved from inherit_resp
            var curr_url = full_url + '&page=' + page_num;
            var next_url = full_url + '&page=' + next_p_num;
            if ( req.query.page ) {
                curr_url = full_url;
                var tmp_url = new URL(full_url);
                //console.log("TMP URL "+tmp_url)
                //const url_new = tmp_url.href.split('?')[0]
                tmp_url.searchParams.delete('page');
                //next_url = url_new + '&page=' + next_p_num;
                next_url = tmp_url.toString() + '&page=' + next_p_num;
            }
            if ( inherit_resp['lastBatch']) {
                meta['last_page'] = "true";
                next_url = "";
            }
            meta['current_page'] = curr_url;
            meta['next_page'] = next_url;
            results['results'] = inherit_resp['documents'] || '';
            results['status'] = 'ready';
            results['meta'] = meta;
        } else if ('msg' in inherit_resp) {
            //console.log(inherit_resp)
            // Include a check to verify: results not ready from results cleared after ttl
            results['results'] = [];
            results['meta'] = meta;
            results['status'] = 'not ready';
        } else if ( 'status' in inherit_resp ) {
            results['status'] =  inherit_resp['status'];
            results['results'] = [];
            results['meta'] = meta;
        }


        res.json({"message":results});
    } catch(err) {
        next(err)
    }
}

// Function to get the available analysis options for performing family analysis
const familyAnalysisOpt = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if ( ! req.body.family_members || ! req.body.host_id || ! req.body.piid ) {
            next("Missing request body parameters")
        }

        var piid = req.body.piid;
        // Validate the piid 
        var family_members = req.body.family_members;
        var mem_obj1 = {"family_members" : family_members};
        const mem_obj = JSON.stringify(mem_obj1);
        console.log(mem_obj);
        var host_id = req.body.host_id;
        // validate the host id
        console.log("Calling getFamAnalysisOpts");
        var resp = await getFamAnalysisOpts(piid,mem_obj,host_id,user_id,center_id,db_conn);
        res.json({"message":resp});
          
    } catch(err) {
        next(err)
    }
}


const familyPreprocess = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if ( ! req.body.family_local_id || ! req.body.affected_mem || ! req.body.assembly_type ||  ! req.body.host_id) {
            next("Missing request body parameters")
        }

        var piid = req.body.piid;
        var host_id = req.body.host_id;
        // validate the host id

        var resp = await triggerPreProcessReq(req.body,piid,host_id,user_id,center_id,db_conn);
        res.json({"message":resp});
    } catch(err) {
        next(err);
    }
}

// Function to get the status of family analysis precomputation
const familyPreprocessStatus = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if ( ! req.params.famLocalID || ! req.query.host_id ) {
            next("Missing request body parameters");
        }

        var family_local_id = req.params.famLocalID;
        var host_id = req.query.host_id;
        console.log(`family_local_id:${family_local_id} host_id:${host_id}`);

        // validate the host id

        var resp = await famPreprocessStatSp(family_local_id,host_id,user_id,center_id,db_conn);
        res.json({"message":resp});
    } catch(err) {
        next(err);
    }
}

// Function to filter variants based on the defined family local id and the filters

const familyFilterQuery = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];

        if ( ! req.body.filter_id || ! req.body.host_id || ! req.body.family_local_id || ! req.body.filter_level ) {
            next("Missing request body parameters");
        }

        var family_local_id = req.body.family_local_id;
        var host_id = req.body.host_id;
        var filter_id = req.body.filter_id;
        var filter_level = req.body.filter_level;

        // validate the host id

        var resp_id = await familyFilterQuerySp(family_local_id,host_id,filter_id,filter_level,user_id,center_id,db_conn);
        res.json({"message":{"request_id":resp_id}});
        //res.json({"message":resp});
    } catch(err) {
        next(err);
    }
}

const SVQueryResult = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        var data = await tokenOps(db_conn,req.token);
        var user_id = data['user_id'];
        var center_id = data['center_id'];
        var tmp_host_id = 0;

        // trio requests will send local id as trio_local_id
        // sample disc requests will send as local_id
        if (  ! req.body.request_id  || ! req.body.host_id ) {
            throw "Missing required parameters in the request";
        }

        if ( req.body.host_id ) {
            tmp_host_id = req.body.host_id;
        }


        //var trio_local_id = req.body.trio_local_id;
        var request_id = req.body.request_id;

        var page_num = 1;
        if ( req.query.page ) {
            page_num = req.query.page;
        } 
        
        req.body.UserID = user_id;
        req.body.CenterID = center_id;
        req.body.PageNum = page_num;
        req.body.HostID = tmp_host_id;
        //var filter_result = await getFilterLeaf(user_id,filter_id,db_conn);
        var inherit_resp = await SVResultsQuery(req.body,db_conn);
        //console.log(inherit_resp);
        var results = {};
        var meta =  {'current_page' : "", 
                      'next_page' : "", 
                       'last_page' : "",
                       'total_pages' : ""};
    
        if ( 'current_page' in inherit_resp && 'total_pages' in inherit_resp ) {
            var full_url = req.protocol + '://' + req.get('host') + req.originalUrl;
            console.log(full_url);  
            console.log( req.originalUrl);
            var next_p_num = inherit_resp['current_page'] + 1;
            meta['last_page'] = "false";
           console.log(next_p_num);
           console.log(req.query.page);
            //console.log("***************************************");
            //console.log(full_url)
            // 'batch' , 'lastBatch' values to be retrieved from inherit_resp
            var curr_url = full_url + '?page=' + page_num;
            var next_url = full_url + '?page=' + next_p_num;
            if ( req.query.page ) {
                curr_url = full_url;
                var tmp_url = new URL(full_url);
                //console.log("TMP URL "+tmp_url)
                const url_new = tmp_url.href.split('?')[0]
                next_url = url_new + '?page=' + next_p_num;
            }
            if ( inherit_resp['total_pages'] === inherit_resp['current_page']) {
                meta['last_page'] = "true";
                next_url = "";
            }
            meta['current_page'] = curr_url;
            meta['next_page'] = next_url;
            meta['total_pages'] = inherit_resp['total_pages'];
            results['results'] = inherit_resp['filtered_variants'] || '';
            results['status'] = 'ready';
            results['meta'] = meta;
        } else if ('msg' in inherit_resp) {
            //console.log(inherit_resp)
            // Include a check to verify: results not ready from results cleared after ttl
            results['results'] = [];
            results['meta'] = meta;
            results['status'] = 'not ready';
        } else if ( 'status' in inherit_resp ) {
            results['status'] =  inherit_resp['status'];
            results['results'] = [];
            results['meta'] = meta;
        }


        res.json({"message":results});
    } catch(err) {
        next(err)
    }
}


module.exports = {individuals,families,piidExec,createFamily,membertype,unassignedMembers,assignMembers,editPhenotype,trios,trioFilter,trioFilterLeaf,trioInherit,trioInheritResult,tokenOps,familyAnalysisOpt,familyPreprocess,familyPreprocessStatus,familyFilterQuery,SVQueryResult,unassignMembers}