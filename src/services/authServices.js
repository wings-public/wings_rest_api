const jwt = require('jsonwebtoken');
const sql = require('mssql')
const dateTime = require('node-datetime');

// Services contains the business logic. This will also invoke the functions that interact with database
const signUser = async(user_id,center_id,user_info,status,db_conn) => {
    try {
        // Updating secret for cryptKey
        var cryptKey = user_info.recordset[0].PasswordHash
        var payload = {
            'user_id': user_id
           };
        //console.log(`UserName:${user_info.recordset[0].UserName}`);
        //console.log(`Affliation: ${user_info.recordset[0].Affiliation}`)
        // payload contains user_id,audience,issuer,subject,iat and exp
        var signOptions = {
            issuer:  process.env.ISSUER,
            // intended user of the token
            subject:  user_info.recordset[0].UserName,
            // identify of the intended recipient of the token
            audience:  user_info.recordset[0].Affiliation,
            //expiresIn:  "12h"
           };
        // Default algorithm : HS256
        var token = jwt.sign(payload, cryptKey, signOptions);
        // Store token details in the table
        var store = await storeTokenAttr(user_id,token,status,db_conn);
        return token
    } catch(err) {
        throw new Error(err.message)
    }
}

// Check if the user id is a registered WiNGS user for that center
const checkUser = async(user_id,center_id,db_conn) => {
    try {
        var result = await db_conn.request()
        .input('input1', sql.Int, center_id)
        .input('input2', sql.Int, user_id)
        .input('input3', sql.Int, 1)
        .query('select Affiliation,UserName,UserFullName,PasswordHash from dbo.AspNetUsers where CenterID = @input1  and UserID = @input2 and UserActive = @input3')
        return result;
    } catch(err) {
        throw err;
    }
}

// Fetches the Password hash from the database for the specific user
const getSecret = async(user_id,db_conn) => {
    try {
        var result = await db_conn.request()
        .input('input1', sql.Int, user_id)
        .input('input2', sql.Int, 1)
        .query('select PasswordHash from dbo.AspNetUsers where UserID = @input1 and UserActive = @input2')
        return result;
    } catch(err) {
        throw err;
    }
}

// Function to decode the token and fetch the user if available
const decodePayload = async(token) => {
    try {
        var msg = ""
        var decoded = jwt.decode(token);
        if ( decoded && 'user_id' in decoded ) {
            msg = decoded.user_id
        } else {
            msg = "Unauthorized User"
        }
        return msg
    } catch(err) {
        throw err
    }
}

// Fetch the center ID corresponding to the UserID
const getCenter = async(user_id,db_conn) => {
    try {
        var result = await db_conn.request()
        .input('input1', sql.Int, user_id)
        .input('input2', sql.Int, 1)
        .query('select CenterID from dbo.AspNetUsers where UserID = @input1 and UserActive = @input2')
        return result;
    } catch(err) {
        throw err;
    }
}


// Check if the user has threshold to execute the request
const requestLimit = async(user_id,db_conn) => {
    try {
        var user_data = await fetchTokenInfo(user_id,db_conn);
        var threshold = process.env.REQ_LIMIT;
        var status = 0;
        //var curTime = await getTime();
        // user record exists in token table.
        if ( user_data.rowsAffected != 0 ) {
            var lastaccess = user_data.recordset[0].LastAccessTime;
            var reqcnt = user_data.recordset[0].ReqCount;
            //console.log("Logging details inside requestLimit function")
            //console.log(lastaccess);
            //console.log(reqcnt)
            const currentTimestamp = new Date();

            let request = db_conn.request();
            var query =  'Update dbo.Tbl_Rest_Api_User SET ReqCount = @ReqCount';
            
            

            //console.log("Initial query is "+query);
            if ( reqcnt > 0 ) {
                // check threshold avg for a minute
                const storedTimestamp = new Date(lastaccess);
                // Calculate the time difference in milliseconds
                const timeDifference = Math.abs(currentTimestamp - storedTimestamp); // Use Math.abs to handle order of subtraction
                //console.log(storedTimestamp);
                //console.log(currentTimestamp)

                // Check  the time difference atleast 1 minute (60,000 milliseconds)
               if ( timeDifference >= 60000 ) {
                    // reset the request counter and update access time
                    reqcnt = 1;
                    query += ', LastAccessTime = @LastAccessTime';
                    request.input('LastAccessTime', sql.DateTime, currentTimestamp);
                    request.input('ReqCount', sql.Int, reqcnt);
                    // update current time - currentTimestamp
                    
               } else {
                    // only the timestamp - currentTimestamp
                    // check if counter has not exceeded
                    if ( reqcnt > threshold ) {
                        status = 1;
                        request.input('ReqCount', sql.Int, reqcnt);
                    } else {
                        // don't update access time
                        reqcnt = reqcnt + 1;
                        request.input('ReqCount', sql.Int, reqcnt);
                        
                    }
               }

                // Output the result
                //console.log(`Stored Timestamp: ${storedTimestamp}`);
                //console.log(`Current Timestamp: ${currentTimestamp}`);
                //console.log(`Time difference is : ${timeDifference}`);
            } else {
                // called for the first time - currentTimestamp
                reqcnt = reqcnt + 1;
                query += ', LastAccessTime = @LastAccessTime';
                request.input('LastAccessTime', sql.DateTime, currentTimestamp);
                request.input('ReqCount', sql.Int, reqcnt);
            }
            //console.log("Logging query after processing the conditions "+query);
            // Execute the query
            // specific to this user id
            query += ' WHERE UserID = @UserID';
            request.input('UserID', sql.Int, user_id);
            await request.query(query);
            
        }
        return status;
    } catch(err) {
        throw err;
    }
}

// Check if the user can generate a new token
const validateUser = async(user_id,db_conn,type) => {
    try {
        var user_data = await fetchTokenInfo(user_id,db_conn);
        var status = "create";
        // user record exists in token table.
        if ( user_data.rowsAffected != 0 ) {
            status = "update";
            var api_access = user_data.recordset[0].APIAccess;
            var valid_token = user_data.recordset[0].ValidToken;
            var forgot_token = user_data.recordset[0].ForgotToken;
            console.log("Log api_access "+api_access)
            console.log("Log valid token "+valid_token)
            console.log("Type "+type)
            var err_obj = {'code' : 403, 'msg' : 'Forbidden'}
            if ( api_access == 2 ) {
                err_obj.msg = "Not Authorized to use API"
                throw err_obj
            //} else if ( valid_token >= 1 && type == "login" ) {
            } else if ( valid_token >= 1 && type == "login" ) {
                err_obj.msg = "Reached Token Limit. Cannot generate new tokens"
                throw err_obj
                //throw "Reached Token Limit. Cannot generate new tokens"
            } else if ( type == "regenerate") {
                status = "regenerate"
                // Setting limit on the number of forgot tokens
                if ( forgot_token > 2 ) {
                    err_obj.msg = "Reached Forgot Token Limit. Cannot generate new tokens. Please contact your center admin"
                    throw err_obj
                    //throw "Reached Forgot Token Limit. Cannot generate new tokens. Please contact your center admin"
                }
            }
        } 
        return status;
    } catch(err) {
        throw err;
    }
}

// Check if this user already has a token
const fetchTokenInfo = async(user_id,db_conn) => {
    try {
        var result = await db_conn.request()
        .input('input1', sql.Int, user_id)
        .query('select * from dbo.Tbl_Rest_Api_User where UserID = @input1')
        return result;
    } catch(err) {
        throw err;
    }
}

const storeTokenAttr = async(user_id,token,stat,db_conn) => {
    try {
        var token_hash = token.substr(68, 108);
        //console.log("Logging token hash "+token_hash)
        // create a new entry for this user
        console.log("What is the status after revoke and create "+stat);
        if ( stat == "create") {
            //console.log("Create a new record")
            var formatted = await getTime();
            // date will be added to CreatedTime and LastAccessTime
            var sql1 = "INSERT INTO dbo.Tbl_Rest_Api_User (UserID,TokenHash,CreatedTime,LastAccessTime,APIAccess,ValidToken) VALUES ("+user_id+','+"'"+token_hash+"'"+','+"'"+formatted+"'"+','+"'"+formatted+"'"+',1,1)';
            //var values = [user_id,token_hash,formatted,1,1]
            //var result = await db_conn.query(sql,[values]);
            //console.log("Logging the SQL ")
            //console.log(sql1)
            var result = await db_conn.query(sql1);
            //console.log("Logging the result after insertion");
            
            //console.log(result.rowsAffected)
        // update the info for this user
        } else if ( stat == "update") {
            //console.log("Update existing record")
            // new token hash ; ValidToken from 0 to 1 
            //console.log('user_id '+user_id)
            //console.log('token_hash sent in storeTokenAttr'+token_hash)
            var formatted = await getTime();
            var result = await db_conn.request()
            .input('input1', sql.Int, user_id)
            .input('input2',sql.Int,1)
            .input('input3',sql.VarChar,token_hash)
            .input('input4',sql.DateTime,formatted)
            .query('Update dbo.Tbl_Rest_Api_User SET ValidToken = @input2 , TokenHash = @input3, CreatedTime=@input4 where UserID = @input1')
            var rowsAffected = result.rowsAffected;
            //console.log("Logging after update "+rowsAffected)
        } else if ( stat == "regenerate" ) {
            var result = await db_conn.request()
            .input('input1', sql.Int, user_id)
            .input('input2',sql.VarChar,token_hash)
            .query('Update dbo.Tbl_Rest_Api_User SET TokenHash = @input2, ForgotToken = ForgotToken+1 where UserID = @input1')
            var rowsAffected = result.rowsAffected;
            //console.log("Logging after update "+rowsAffected)
        }
        return "success"
    } catch(err) {
        //console.log(err)
        throw err
    }
}

const getTime = async() => {
    try {
        var dt = dateTime.create();
        var formatted = dt.format('Y-m-d H:M:S');
        return formatted;
    } catch(err) {
        throw err
    }
}

// Revoke the token of the user
const revokeToken = async(db_conn,tok) => {
    try {
        var user_id = await decodeUser(tok)
        var token_hash = tok.substr(68, 108);
        var msg = "No Valid Token to revoke"
        // Include another query to check if there are any token to revoke.
        
        var result1 = await db_conn.request()
        .input('input1', sql.Int, user_id)
        .query('Select ValidToken from dbo.Tbl_Rest_Api_User where UserID = @input1')
        if ( result1.recordset[0].ValidToken > 0 ) {
            //console.log("Token sent in revoke "+token_hash)
            // Decrement ValidToken in dbo.Tbl_Rest_Api_User
            var result = await db_conn.request()
            .input('input1', sql.Int, user_id)
            .input('input2',sql.Int,0)
            .input('input3',sql.VarChar,token_hash)
            .query('Update dbo.Tbl_Rest_Api_User SET ValidToken = @input2 ,TokenHash = @input3 where UserID = @input1')
            var rowsAffected = result.rowsAffected;
            msg = "Token revoked"

            // Add the token and time to Tbl_Rest_Api_RevokedToken
            await revokedTokens(user_id,token_hash,db_conn)
            //console.log("Token added to revoked tokens list")
        }
        return msg 
    } catch(err) {
        throw err;
    }
}

// Decode the token payload and retrieve the user_id
const decodeUser = async(tok) => {
    try {
        var decoded = jwt.decode(tok);
        var user_id = ""
        if ( decoded && 'user_id' in decoded ) {
            user_id = decoded.user_id
        } 
        return user_id
    } catch(err) {
        throw err;
    }
}

// Check if token is not revoked
const checkTokStatus = async(user_id,token,db_conn) => {
    try {
        var token_hash = token.substr(68, 108);
        var status = "valid"
        //console.log("Checking for user_id "+user_id)
        //console.log("Checking for token_hash "+token_hash)
        // Query and check if token hash is present in revoked token
        var result = await db_conn.request()
        .input('input1', sql.Int, user_id)
        .input('input2', sql.VarChar, token_hash)
        .query('select * from dbo.Tbl_Rest_Api_RevokedToken where UserID = @input1 and TokenHash = @input2')
        // Replace the above check with Tbl_Rest_Api_RevokedToken to check if token hash is listed in the revoked tokens table.
        if ( result.rowsAffected > 0 ) {
            status = "revoked"
        }
        //console.log("Logging status "+status)
        return status;
    } catch(err) {
        throw err
    }
}

// Insert the revoked token hash  to sql table for tracking revoked tokens
const revokedTokens = async(user_id,token_hash,db_conn) => {
    try {
        var formatted = await getTime();
        var sql1 = "INSERT INTO dbo.Tbl_Rest_Api_RevokedToken (UserID,TokenHash,AccessTime) VALUES ("+user_id+','+"'"+token_hash+"'"+','+"'"+formatted+"'"+')';
        //console.log("Logging the SQL to add the revoked token")
        //console.log(sql1)
        var result = await db_conn.query(sql1);
        //console.log("Logging the result after insertion");
        //console.log(result.rowsAffected)
        return "success"
    } catch(err) {
        throw err
    }
}

// revoke api access for the user
const revokeApiAccess = async(user_id,db_conn) => {
    try {
        var msg = `revoked access for ${user_id}`
        var result = await db_conn.request()
        .input('input1', sql.Int, user_id)
        .input('input2', sql.Int, 1)
        .query('select TokenHash from dbo.Tbl_Rest_Api_User where UserID = @input1 and APIAccess = @input2')
        if ( result.rowsAffected == 0 ) {
            msg = `User ${user_id} does not have api access`
        } else {
            var tok_hash = result.recordset[0].TokenHash
            //console.log("Logging tok hash "+tok_hash)

            // add token to revoked tokens
            await revokedTokens(user_id,tok_hash,db_conn)

            // Revoke api access for the user.
            await updateApiAccess(user_id,tok_hash,0,0,db_conn)
        }
        return msg 
    } catch(err) {
        throw err;
    }
}

// function to update api access and token based on the parameters
const updateApiAccess = async(user_id,tok_hash,api_access,valid_token,db_conn) => {
    try {
        var result = await db_conn.request()
            .input('input1', sql.Int, user_id)
            .input('input2',sql.Int,api_access)
            .input('input3',sql.Int,valid_token)
            .input('input4',sql.Int,0)
            .query('Update dbo.Tbl_Rest_Api_User SET APIAccess = @input2 ,ValidToken = @input3, ForgotToken = @input4 where UserID = @input1')
            //console.log("Logging the result after api access update");
            //console.log(result.rowsAffected)
            return "success"
    } catch(err) {
        throw err;
    }
}

// Invokes function to provide api access for user
const reactivateAccess = async(user_id,db_conn) => {
    try {
        // Revoke api access for the user.
        await updateApiAccess(user_id,"dummy",1,0,db_conn)
        return "success"
    } catch(err) {
        throw err
    }
}

// Execute stored procedure to check and refresh token for Center API
const centerApiToken = async(user_id,center_id,token_type,new_center_id,tok_host_type,db_conn) => {
    try {
        console.log(`${user_id},${center_id},${token_type},${new_center_id},${tok_host_type}`)
        // 1085,3,2,-1,1
        // sp_API_Token 
        var result = await db_conn.request()
            .input('UserID', sql.Int, user_id)
            .input('CenterID',sql.Int,center_id)
            .input('NewCenterID',sql.Int,new_center_id)
            .input('ActiveToken',sql.Int,token_type)
            .input('Host',sql.Int,tok_host_type)
            .execute('dbo.sp_API_Token');
            var token = result.recordset;
            //console.log("Logging centerApiToken")
            //console.log(token)
            return "success"
    } catch(err) {
        throw err
    }
}

const dbTableActions = async(db_conn,action,table) => {
    try {
        var user_id = 1085;
        //var table_name = "dbo.Tbl_Rest_Api_User";
        var query_req = "";
        if ( action == "Select") {
            query_req = `Select * from  ${table} where UserID = @input1`;
        } else if ( action == "delete") {
            //query_req = `delete from  ${table} where UserID = @input1`;
            throw "Operation not allowed"
        }
        //console.log("Printing query request")
        //console.log(query_req)
        
        var result1 = await db_conn.request()
        .input('input1', sql.Int, user_id)
        .query(query_req)
        //.query('Select * from dbo.Tbl_Rest_Api_User where UserID = @input1')
        //.query('delete from dbo.Tbl_Rest_Api_User where UserID = @input1')
        //.query('Select * from dbo.Tbl_Rest_Api_RevokedToken where UserID = @input1')
        //.query('delete from dbo.Tbl_Rest_Api_RevokedToken where UserID = @input1')
        if ( result1.recordset ) {
            console.log(result1.recordset);
            return result1.recordset;
        } 
    } catch(err) {
        throw err;
    }
}

const checkUserAccessToPI = async(user_id,center_id,piid,db_conn) => {
    try {
        console.log(`${user_id},${center_id},${piid}`)
        // 1085,3,2,-1,1
        // sp_API_Token 
      
        var result = await db_conn.request()
            .input('UserID', sql.Int, user_id)
            .input('CenterID',sql.Int,center_id)
            .input('InputType',sql.Int,-1)
            .execute('dbo.Sp_PI_Sel');
            //console.log(result.recordset);
            //console.log("Logging centerApiToken")
            //console.log(token)
            const exists = result.recordset.some(row => row.PIID === piid);
            if (exists) {
                return "success";
              } else {
                return "No access to specified PI"
              }
            
    } catch(err) {
        throw err
    }
}


module.exports = {checkUserAccessToPI,signUser,checkUser,getCenter,getSecret,validateUser,revokeToken,checkTokStatus,revokeApiAccess,reactivateAccess,decodePayload,centerApiToken,dbTableActions,requestLimit}; 
