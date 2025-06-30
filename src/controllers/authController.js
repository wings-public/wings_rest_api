const authServices = require('../services/authServices.js');

const { signUser, checkUser, getCenter, getSecret,validateUser,revokeToken,checkTokStatus,revokeApiAccess,reactivateAccess,dbTableActions,requestLimit } = authServices;

const jwt = require('jsonwebtoken');

// Validate the request object and send the request to the appropriate service.
// Response will be sent by the controller
const loginUser = async(req, res,next)  => {
    try {
        //console.log("Received request body - ");
        //console.log("Login Request");
        //(req.body);
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        //console.log("DB Connection object "+db_conn);
        const {user_id,center_id} = req.body;
        // check if user exists in the center
        var user_info = await checkUser(user_id,center_id,db_conn);
        //console.log("Logging user_info");
        //console.log(user_info);
        if ( user_info.rowsAffected == 0 ) {
            var err = { 'code' : 403, 'msg' : "Forbidden"}
            throw err
        } else {
            //console.log("Valid User");
            // Check endpoint
            var type = "login";
            //console.log("Regenerate Query ")
            //console.log(req.url)
            const regex = /regenerate/g;
            
            if ( req.url.match(regex) ) {
                type = "regenerate"
                //console.log("Request Type is regenerate")
            }
            var status = await validateUser(user_id,db_conn,type);
            //console.log("Logging status after validation "+status)
            var token = await signUser(user_id,center_id,user_info,status,db_conn);
            var respHash = { "message" : token,
                            "info" : "Tokens are credentials, please store them properly. WiNGS does not store tokens and you will not be able to fetch the token again using WiNGS interface."}
            //return res.json({"message":token});
            //res.header("Access-Control-Allow-Origin", "*");
            return res.json(respHash);
        }
        //console.log("Status after checking user ");
        //console.log(status);
    } catch(err) {
        next(err);
    }
}

const loginOpt = async(req, res,next)  => {
    try {

        // setup a json config for fetching this 
        var example = `POST http://localhost:5000/login HTTP/1.1\n content-type: application/json \n { 'user_id' : 1085 , 'center_id' : 3}`;
        // setup a json config for fetching this
        var req_params = {"user_id" : "ID for WiNGS User", "center_id" : "ID for center defined in WiNGS"}
        var resp_obj = { 'description' : "Endpoint to get token for the specified center",
                         'request_type' : "POST",
                         "request_body" : req_params,
                         "example" : example }
        return res.json({"message":resp_obj});

    } catch(err) {
        next(err)
    }
}

// Middleware function which will be linked to every route that requires token authentication
const verifyToken = async(req,res,next) => {
    try {
        if ( req.token ) {
            var db_conn = req.app.locals.db;
            var decoded = jwt.decode(req.token);
            if ( decoded && 'user_id' in decoded ) {
                //console.log("Received revoke request");
                var result = await getCenter(decoded.user_id,db_conn)
                var status = await checkTokStatus(decoded.user_id,req.token,db_conn)

                if ( status == "revoked" ) {
                    var err1 = {'code':401,'msg' : 'Unauthorized-Revoked Token'}
                    next(err1)
                }
                //console.log("Logging the decoded center id")
                //console.dir(result,{"depth":null})
                if ( result.recordset[0].CenterID ) {
                    // fetch the secret to compare with the secret in the token
                    var center_id = result.recordset[0].CenterID
                    var secret = await getSecret(decoded.user_id,db_conn);
                    const cryptKey = secret.recordset[0].PasswordHash
                    //console.log("Logging the decoded cryptKey ")
                    //console.log(cryptKey)
                    /*const { createHmac } = await import('crypto');
                    var center_id = result.recordset[0].CenterID;
                    const secret = decoded.user_id+'##'+center_id;
                    const cryptKey = createHmac('sha256', secret)
                                    .digest('hex');
                    console.log(`NOW : ${cryptKey}`);*/

                    var user_info = await checkUser(decoded.user_id,center_id,db_conn);
                    //console.dir(user_info,{"depth":null})
                    try {
                        var verify_token = jwt.verify(req.token, cryptKey, {iss: process.env.ISSUER,aud: 
                            user_info.recordset[0].Affiliation, sub: user_info.recordset[0].UserName });
                        var limit_exceed = await requestLimit(decoded.user_id,db_conn);
                        if ( limit_exceed ) {
                            var err1 = {'code':401,'msg' : 'Request limit exceeded.Please wait and execute'}
                            next(err1)
                        }
                        console.log("Does it still come here??? error case");
                        // check if user has limit to execute request
                        //console.log("Token Verified");
                        //console.log(verify_token)
                        next();
                    } catch(err) {
                        console.log(err);
                        var err1 = {'code':401,'msg' : 'Unauthorized User'}
                        //console.log(err)
                        next(err1)
                        //throw err;
                    }
                    
                }
            } else {
                var err1 = {'code':401,'msg' : 'Unauthorized-Invalid Token'}
                next(err1)
            }
            //console.log(db_conn)
        } else {
            //console.log("API request without header")
            var err1 = {'code':401,'msg' : 'Unauthorized User'}
            next(err1)
        }
        
    } catch(err) {
        var err1 = {'code':401,'msg' : `${err}`}
        next(err1)
    }
}

// Validates the request and triggers function based on request type.test comment.
const revoke = async(req, res,next)  => {
    try {
        //console.log("******** Here revoke")
        //console.log(req.query)
        var db_conn = req.app.locals.db;

        //console.dir(req.query,{"depth":null});
        if ( req.token ) {
            if ( req.query.type == "admin" ) {
                //console.log("request query type "+req.query.type)
                if ( !req.body.user_id ) {
                    next("user_id required");
                }
                var req_user = req.body.user_id
                // ToDo : Check if the request user has admin access
                var msg = await revokeApiAccess(req_user,db_conn)
                res.json({"message": msg});
            } else {
                var msg = await revokeToken(db_conn,req.token) 
                res.json({"message": msg});
            }
        }
    } catch(err) {
        next(err)
    }
}


// Validates the request and triggers function to reactivate api access
const reactivate = async(req, res,next)  => {
    try {
        //console.log("******** Here reactivate")
        var db_conn = req.app.locals.db;

        //console.dir(req.query,{"depth":null});
        if ( req.token ) {
            if ( req.query.type = "admin" ) {
                if ( !req.body.user_id ) {
                    next("user_id required");
                }
                var req_user = req.body.user_id
                // ToDo : Check if the request user has admin access
                var msg = await reactivateAccess(req_user,db_conn)
                res.json({"message": msg});
            } 
        }
    } catch(err) {
        next(err)
    }
}




const dbOps = async(req, res,next)  => {
    try {
        //console.log("******** Here reactivate")
        var db_conn = req.app.locals.db;

        //console.dir(req.query,{"depth":null});
        if ( req.token ) {
            var msg = "";
            console.log(req.body.table_name)
            console.log(req.body.action)
            if ( !req.body.table_name ) {
                next("Please provide table name");
            } else if ( req.body.table_name != "dbo.Tbl_Rest_Api_User" && req.body.table_name != "dbo.Tbl_Rest_Api_RevokedToken") {
                next("Invalid request-Provide a valid table name");
            } else {
                var msg = await dbTableActions(db_conn,req.body.action, req.body.table_name);
                res.json({"message": msg}); 
            }
            
        }
    } catch(err) {
        next(err)
    }
}

module.exports = {loginUser,verifyToken,revoke,reactivate,loginOpt,dbOps}; 
