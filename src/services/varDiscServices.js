const sql = require('mssql')
const lodash = require("lodash")
const ind_meta_conf = require('../../config/ind_edit_conf.json');
const { result, max } = require('lodash');
// Including config to retrieve DB_BASE_INFO from config file
require('dotenv').config({ debug: process.env.DEBUG , path: './config/.env'});


async function centerList(db_conn) {
    try {
        var output_var = ""
        var result = await db_conn.request()
        .execute('dbo.Sp_Filter_TblCenterHost_Sel');
        console.dir(result,{"depth":null})
        //console.log(output_var)
 
        return result.recordset;
        //return "success"
    } catch(err) {
        throw new Error(err.message);
    }
}


async function varReqGenSp(db_conn,center_id,host_id,variant,assembly_type) {
    try {
        var output = {};
        var result = await db_conn.request()
        .input('CenterID',sql.Int,center_id)
        .input('HostID',sql.Int,host_id)
        .input('Variant',sql.VarChar(200),variant)
        .input('RefBuild',sql.VarChar(20),assembly_type)
        .execute('dbo.Sp_Filter_Variant_ReqId_Sel');
        console.dir(result,{"depth":null})
        //console.log(output_var)
        output = result.recordset[0];
        return output;
        //return "success"
    } catch(err) {
        throw new Error(err.message);
    }
}

async function storeReqDB(db_conn, req_json, hpo_list, user_id = null, query_hash = null) {
    try {
        console.log("Logging the request json");
        console.log(req_json);
        var req_id = -1;
        
        // Build query dynamically based on whether user_id and query_hash are provided
        var query_string;
        var request = db_conn.request()
            .input('input1', sql.NVarChar(4000), JSON.stringify(req_json))
            .input('input2', sql.NVarChar(1000), JSON.stringify(hpo_list));
        
        if (user_id !== null && query_hash !== null) {
            // Include user_id and query_hash for rate limiting
            query_string = `insert into Tbl_Req_Track(Msg, HPO, UserID, QueryHash) values(@input1, @input2, @user_id, @query_hash)`;
            request.input('user_id', sql.Int, user_id)
                   .input('query_hash', sql.VarChar(64), query_hash);
        } else {
            // Legacy behavior - without tracking
            query_string = `insert into Tbl_Req_Track(Msg, HPO) values(@input1, @input2)`;
        }
        
        var result = await request.query(query_string);

        // request to get the identity id
        var result1 = await db_conn.request()
            .query('select @@IDENTITY AS [@@IDENTITY]')
        console.log(result1.recordset);

        var rec_set = result1.recordset[0];
        console.log(rec_set);
        if (rec_set['@@IDENTITY']) {
            console.log("Logging the last inserted id");
            req_id = rec_set['@@IDENTITY'];
            console.log(req_id);
        }

        return req_id;
    } catch(err) {
        throw new Error(err.message);
    }
}

async function varFreqResSp(db_conn,req_id,center_id,host_id) {
    try {
        var output = {};
        var result = await db_conn.request()
        .input('CenterID',sql.Int,center_id)
        .input('HostID',sql.Int,host_id)
        .input('ReqId',sql.BigInt,req_id)
            .execute('dbo.Sp_Filter_Variant_Result_PerHost_Sel');
        console.log("Logging response from SP -----------------------");
        
        //console.log(output_var)
        //console.dir(result, { "depth": null });
        //output = JSON.parse(result.recordset[0]);
        //console.log("Logging -----------------------")
        //console.dir(output, { "depth": null })
        //console.log("Done -------------------------------------------");

        //var tmpRes = JSON.parse(result)[0];
        //console.dir(tmpRes, { "depth": null });
        output = result.recordset[0][''];
        var tmpRes = JSON.parse(output);
        console.dir(tmpRes, { "depth": null });
        //console.dir(JSON.stringify(tmpRes), { "depth": null });
        //var output = JSON.parse(tmpRes['message']);
        //console.dir(output, { "depth": null });
        //return output;
        return tmpRes;
        //return "success"
    } catch(err) {
        throw new Error(err.message);
    }
}

// Get the stored request details from database
async function getVarDiscReqObj(db_conn,req_id) {
    try {
        var query_string = `select Msg from  Tbl_Req_Track where Reqid = @input1 FOR JSON PATH`;

        var result = await db_conn.request()
        .input('input1', sql.Int, req_id)
        .query(query_string)
        // key returned for JSON Path. Key is constant.
        if ( result.recordset[0] && 'JSON_F52E2B61-18A1-11d1-B105-00805F49916B' in result.recordset[0] ) {
            result = result.recordset[0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B'];
        }

        console.log(JSON.parse(result)[0]);
        var tmpRes = JSON.parse(result)[0];
        console.log(tmpRes);
        var result1 = JSON.parse(tmpRes['Msg']);
        console.log("Logging result1");
        console.log(result1);
        //var result2 = JSON.parse(result1);
        //console.log("Logging result2");
        //console.log(result2);
        
        
        //result = testResult[0]['Msg'];
        //console.log(result);
        //console.log(result[0]);
        return result1;
    } catch(err) {
        throw new Error(err.message);
    }
}



async function getHPOParent(db_conn,hpo_id) {
    try {
        var output = {};
        var result = await db_conn.request()
        .input('hpo',sql.VarChar(10),hpo_id)
        .execute('dbo.Sp_PhenBook_HPO_Search_Edges');
        
        //console.log(output_var)
        output = result.recordset;
        return output;
        //return "success"
    } catch(err) {
        throw new Error(err.message);
    }
}

async function getHPOChild(db_conn,hpo_id) {
    try {
        var output = {};
        var result = await db_conn.request()
        .input('hpo',sql.VarChar(10),hpo_id)
        .execute('dbo.Sp_PhenBook_HPO_Search_Edges_Parent_To_Child');
        
        //console.log(output_var)
        output = result.recordset;
        return output;
        //return "success"
    } catch(err) {
        throw new Error(err.message);
    }
}

// Get the stored request details from database
async function getAdminID(db_conn,center_id,host_id) {
    try {
        var query_string = `SELECT  AdminCenter
        from Viw_Centers_host where CenterID= @input1 and HostID = @input2`;

        var result = await db_conn.request()
        .input('input1', sql.Int, center_id)
        .input('input2', sql.Int, host_id)
        .query(query_string)
        // key returned for JSON Path. Key is constant.
        if ( result.recordset[0] && 'AdminCenter' in result.recordset[0] ) {
            result = result.recordset[0]['AdminCenter'];
        }

        //var tmpRes = JSON.parse(result)[0];        
        return result;
    } catch(err) {
        throw new Error(err.message);
    }
}

async function fetchHpoNames(db_conn,hpo) {
    try {


        // Create a parameterized query
        let placeholders = hpo.map((_, i) => `@hpo${i}`).join(', ');
        let query = `SELECT HPO_Name FROM ${process.env.DB_BASE_INFO}.dbo.Tbl_HPO
         WHERE HPOID IN (${placeholders})`;

        // Add parameters to the request
        let request = db_conn.request();
        hpo.forEach((hpo, index) => {
            request.input(`hpo${index}`, sql.NVarChar, hpo);
        });

        // Execute the query
        const result = await request.query(query);
       
        console.log("Logging results ");
        console.log(result.recordset);
        var hpoRes = [];
        for ( var idx in result.recordset ) {
            var hpoT = result.recordset[idx].HPO_Name;
            hpoRes.push(hpoT);
        }

        console.log(hpoRes);
        return hpoRes;
    } catch(err) {
        throw new Error(err.message);
    }
}

async function fetchHpo(db_conn, hpo, type) {
    try {


        // Create a parameterized query
        let placeholders = hpo.map((_, i) => `@hpo${i}`).join(', ');
        var query = "";
        if (type == "hpoid") {
            query = `SELECT HPO_Name,HPOID FROM ${process.env.DB_BASE_INFO}.dbo.Tbl_HPO
            WHERE HPOID IN (${placeholders})`;
        } else if (type == "hpoterm") {
            query = `SELECT HPO_Name,HPOID FROM ${process.env.DB_BASE_INFO}.dbo.Tbl_HPO
            WHERE HPO_Name IN (${placeholders})`;
        }

        console.log(query);


        // Add parameters to the request
        let request = db_conn.request();
        hpo.forEach((hpo, index) => {
            request.input(`hpo${index}`, sql.NVarChar, hpo);
        });

        // Execute the query
        const result = await request.query(query);

        console.log("Logging results ");
        console.log(result.recordset);

        var hpoRes = {};
        for (var idx in result.recordset) {
            var hpoT = result.recordset[idx].HPO_Name;
            var hpoid = result.recordset[idx].HPOID;
            hpoRes[hpoid] = hpoT;
        }

        console.log(hpoRes);
        return hpoRes;
    } catch (err) {
        throw new Error(err.message);
    }
}


async function varPhenReqSp(db_conn,center_id,host_id,json_req,assembly_type,seq_type,filter_level,filter_id,admin_id) {
    try {
        var output_var = "";
        var output = {};
        var result = await db_conn.request()
        .input('VarSearch',sql.NVarChar(sql.MAX),JSON.stringify(json_req))
        .input('CenterID',sql.Int,center_id)
        .input('HostID',sql.Int,host_id)
        .input('UserID',sql.Int,admin_id)
        .input('Selected_FiterItemLevels_CommaSep',sql.VarChar(200),filter_level)
        .input('FilterID',sql.Int,filter_id)
        .input('RefBuild',sql.VarChar(20),assembly_type)
        .input('SeqType',sql.VarChar(20),seq_type)
        .output('Output',sql.VarChar(100),output_var)
        .execute('dbo.Sp_GAP_VariantDiscovery_Query_API');
        console.dir(result,{"depth":null})
        //console.log(output_var)
        output = result.recordset[0];
        //var output_val = result.output.Output;
        return output;
        //return "success"
    } catch(err) {
        throw new Error(err.message);
    }
}

// Execute variant phen results stored proc
async function varPhenResultSp(db_conn,req_id,center_id,host_id) {
    try {
        var output_var = ""
        console.log("logging details - varPhenResultSp")
        console.log(`center_id:${center_id} host_id:${host_id} req_id:${req_id}`)
        var result = await db_conn.request()
        .input('CenterID',sql.Int,center_id)
        .input('HostID',sql.Int,host_id)
        .input('ReqId',sql.BigInt,req_id)
        .input('ClientAPI',sql.VarChar(100),'queryResults/')
        .output('feedbackOUT',sql.NVarChar(sql.MAX),output_var)
        .execute('dbo.Sp_GAP_VariantDiscovery_Query_Result_API');
        
        //console.dir(result,{"depth":null})
        //console.log(output_var)
        //output = result.recordset[0];
        var output_val = result.output.feedbackOUT;
        var response = "";
        if ( output_val != '') {
            response = JSON.parse(output_val)
        }
        //var response = {'st' : output_val}
        return response;
        //return "success"
    } catch(err) {
        throw new Error(err.message);
    }
}

// Execute variant phen statistics api
async function varPhenStatsSp(db_conn,overall_cnt) {
    try {
        var output = ""
        var response = {'p-value' : null}
        console.log("logging details - varPhenStatsSp")

        var result = await db_conn.request()
        .input('VariantPhenotype',sql.Int,overall_cnt['var+phen'])
        .input('NoVariantPhenotype',sql.Int,overall_cnt['-var+phen'])
        .input('VariantNoPhenotype',sql.Int,overall_cnt['var-phen'])
        .input('NoVariantNoPhenotype',sql.Int,overall_cnt['-var-phen'])
        
        .execute('dbo.Sp_Filter_Result_Stats_FisherTest_PValue_Sel');
        
        output = result.recordset[0];
        if ('PValue' in output) {
            response['p-value'] = output['PValue'];
        }

        return response;
        
    } catch(err) {
        throw new Error(err.message);
    }
}

// execute stored procedure to get the PIID
async function varContactPISp(db_conn,req_id,center_id,host_id,variant,admin_id,req_type) {
    try {
        var output_var = "";
        var output = {};
        console.log("varContactPISp");
        console.log(`req_id:${req_id} center_id:${center_id} host_id:${host_id} variant:${variant} admin_id:${admin_id}`);
        var result = await db_conn.request()
        .input('Variant',sql.NVarChar(sql.MAX),variant)
        //.input('ReqID',sql.Int,req_id)
        .input('ReqID', sql.BigInt, req_id)
        .input('CenterID',sql.Int,center_id)
        .input('HostID',sql.Int,host_id)
        .input('UserID', sql.Int, admin_id)
        .input('Type', sql.VarChar(100),req_type)
        .output('Output',sql.VarChar(100),output_var)
        .execute('dbo.Sp_GAP_VariantDiscovery_Contact_API');
        console.log("Function varContactPISp");
        console.dir(result,{"depth":null})
        //console.log(output_var)
        output = result.recordset[0];
        //var output_val = result.output.Output;
        return output;
        //return "success"
    } catch(err) {
        throw new Error(err.message);
    }
}

// execute stored procedure to contact PI
async function varMailSp(db_conn,jsonReq,center_id,host_id,user_id) {
    try {
        var output_var = "";
        var output = {};

        console.log("varMailSp")
        // Note : Function varPhenCollab does the stringify(jsonReq)
        //console.dir(JSON.stringify(jsonReq),{"depth":null});
        console.log(`center_id:${center_id} host_id:${host_id} user_id:${user_id}`)
        var result = await db_conn.request()
        .input('jsonReq',sql.NVarChar(sql.MAX),jsonReq)
        .input('CenterID',sql.Int,center_id)
        .input('HostID',sql.Int,host_id)
        .input('UserID',sql.Int,user_id)
        .execute('dbo.Sp_GAP_VariantDiscovery_Collab_Status');
        console.log("Function varMailSp");
        console.dir(result,{"depth":null})
        //console.log(output_var)
        output = result.recordset[0];
        //var output_val = result.output.Output;
        return output;
        //return "success"
    } catch(err) {
        throw new Error(err.message);
    }
}


const varCollabStat = async(user_id,request_id,db_conn) => {
    try {
        console.log("user id "+user_id);
        console.log("request id "+request_id);
        var result = await db_conn.request()
        .input('input1', sql.Int, request_id)
        .input('input2', sql.Int, user_id)
        .query('SELECT Reqid,PIID,Status from dbo.Tbl_Var_Collab_Status where CentralReqid = @input1  and Requestor = @input2')
        console.dir(result.recordset,{"depth":null});
        return result.recordset;
    } catch(err) {
        throw err;
    }
}

async function varAssociateReqSp(db_conn,center_id,host_id,variant,hpo,assembly_type,seq_type) {
    try {
        var output = {};
        var result = await db_conn.request()
        .input('CenterID',sql.Int,center_id)
        .input('HostID',sql.Int,host_id)
        .input('Variant',sql.VarChar(200),variant)
        .input('RefBuild',sql.VarChar(20),assembly_type)
        .input('PhenTerm',sql.VarChar(200),hpo)
        .input('SeqType',sql.VarChar(5),seq_type)
        .execute('dbo.Sp_Filter_Variant_Phen_ReqId_Sel');
        console.dir(result,{"depth":null})
        //console.log(output_var)
        output = result.recordset[0];
        return output;
        //return "success"
    } catch(err) {
        throw new Error(err.message);
    }
}

async function varAssociateRespSp(db_conn,req_id,center_id,host_id) {
    try {
        var output = {};
        var result = await db_conn.request()
        .input('CenterID',sql.Int,center_id)
        .input('HostID',sql.Int,host_id)
        .input('ReqId',sql.BigInt,req_id)
        .execute('dbo.Sp_Filter_Variant_Phen_Result_PerHost_Sel_API');
        console.dir(result,{"depth":null})
        //console.log(output_var)
        output = result.recordset[0];
        return output;
        //return "success"
    } catch(err) {
        throw new Error(err.message);
    }
}

// Check daily HPO query limit for a user (configurable, default 15 queries per day)
async function checkDailyHpoQueryLimit(db_conn, user_id) {
    try {
        // Get daily limit from environment or default to 15
        var max_daily_queries = parseInt(process.env.MAX_DAILY_HPO_QUERIES) || 15;
        
        var query_string = `
            SELECT COUNT(*) as query_count 
            FROM Tbl_Req_Track 
            WHERE UserID = @user_id 
            AND CAST(CreatedDate AS DATE) = CAST(GETDATE() AS DATE)
        `;
        var result = await db_conn.request()
            .input('user_id', sql.Int, user_id)
            .query(query_string);
        
        var count = result.recordset[0].query_count;
        console.log(`Daily HPO queries for user ${user_id}: ${count}/${max_daily_queries}`);
        
        if (count >= max_daily_queries) {
            // Log the rate limit violation
            await logRateLimitViolation(db_conn, user_id, 'daily_limit', count, null);
            return false;
        }
        
        return true;
    } catch(err) {
        throw new Error(err.message);
    }
}

// Check exact duplicate query limit (configurable, default 10)
async function checkExactQueryLimit(db_conn, user_id, query_hash, max_exact_queries = 10) {
    try {
        var query_string = `
            SELECT COUNT(*) as query_count 
            FROM Tbl_Req_Track 
            WHERE UserID = @user_id 
            AND QueryHash = @query_hash
        `;
        var result = await db_conn.request()
            .input('user_id', sql.Int, user_id)
            .input('query_hash', sql.VarChar(64), query_hash)
            .query(query_string);
        
        var count = result.recordset[0].query_count;
        console.log(`Exact query count for user ${user_id} (hash: ${query_hash.substring(0,8)}...): ${count}/${max_exact_queries}`);
        
        if (count >= max_exact_queries) {
            // Log the rate limit violation
            await logRateLimitViolation(db_conn, user_id, 'exact_query_limit', count, query_hash);
            return false;
        }
        
        return true;
    } catch(err) {
        throw new Error(err.message);
    }
}

// Log rate limit violations for tracking and auditing
async function logRateLimitViolation(db_conn, user_id, violation_type, query_count, query_hash) {
    try {
        var query_string = `
            INSERT INTO Tbl_RateLimit_Violations (UserID, ViolationType, QueryCount, QueryHash, ViolationDate)
            VALUES (@user_id, @violation_type, @query_count, @query_hash, GETDATE())
        `;
        await db_conn.request()
            .input('user_id', sql.Int, user_id)
            .input('violation_type', sql.VarChar(50), violation_type)
            .input('query_count', sql.Int, query_count)
            .input('query_hash', sql.VarChar(64), query_hash)
            .query(query_string);
        
        console.log(`Rate limit violation logged: User ${user_id}, Type: ${violation_type}, Count: ${query_count}`);
    } catch(err) {
        // Don't throw error if logging fails - just log it
        console.error(`Failed to log rate limit violation: ${err.message}`);
    }
}

module.exports = {centerList,varReqGenSp,varFreqResSp,storeReqDB,getVarDiscReqObj,getHPOParent,getHPOChild,varPhenReqSp,getAdminID,varPhenResultSp,varPhenStatsSp,varContactPISp,varMailSp,varCollabStat,fetchHpoNames,varAssociateReqSp,varAssociateRespSp,fetchHpo,checkDailyHpoQueryLimit,checkExactQueryLimit}