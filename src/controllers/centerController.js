const centerServices = require('../services/centerServices.js');
const authServices = require('../services/authServices.js');

const {decodePayload,centerApiToken,getCenter} = authServices
const {getHosts} = centerServices

// Function to get the hosts within a specific center
const hosts = async(req,res,next) => {
    try {
        // Fetch the sql connection object
        var db_conn = req.app.locals.db;
        //console.log("Logging request body----------")
        //console.log(req.body)
        // services Function : Fetch the user id and center id from token
        var user_id = await decodePayload(req.token)
        var result1 = await getCenter(user_id,db_conn)
        var center_id = result1.recordset[0].CenterID || null
        //console.log("user_id"+user_id)
        //console.log("center_id"+center_id)

        // Function to call sp to get the token for external center API
        var token_type = process.env.TOK_LOGIN
        var new_center_id = -1
        var tok_host_type = process.env.TOK_HOST_TYPE
        await centerApiToken(user_id,center_id,token_type,new_center_id,tok_host_type,db_conn);
        // services Function : execute stored procedure to get all data

        var resp = await getHosts(db_conn,center_id);

        res.json({"message":resp.recordset});
    } catch(err) {
        next(err)
    }
}

module.exports = {hosts};