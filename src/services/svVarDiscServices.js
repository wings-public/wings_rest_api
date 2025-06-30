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

async function storeReqDB(db_conn,req_json) {
    try {

        console.log("Logging the request json");
        console.log(req_json);
        var req_id = -1;
        var query_string = `insert into Tbl_Req_Track(Msg) values(@input1)`;
        var result = await db_conn.request()
                     .input('input1', sql.NVarChar(4000), JSON.stringify(req_json))
                     .query(query_string);

        // request to get the identity id
        var result1 = await db_conn.request()
                     .query('select @@IDENTITY AS [@@IDENTITY]')
        console.log(result1.recordset);

        var rec_set = result1.recordset[0];
        console.log(rec_set);
        if (  rec_set['@@IDENTITY'] ) {
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
        console.dir(result,{"depth":null})
        //console.log(output_var)
        output = result.recordset[0];
        return output;
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


async function varPhenReqSp(db_conn,center_id,host_id,json_req,admin_id) {
    try {
        var output_var = "";
        var output = {};
        var result = await db_conn.request()
        .input('CenterID',sql.Int,center_id)
        .input('HostID',sql.Int,host_id)
        .input('UserID',sql.Int,admin_id)
        .input('jsonInput', sql.NVarChar(sql.MAX), JSON.stringify(json_req))
        .execute('dbo.Sp_SV_VarDisc_Freq');
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
        .input('ClientAPI',sql.VarChar(100),'VarDiscSV/')
        .output('feedbackOUT',sql.NVarChar(sql.MAX),output_var)
        .execute('dbo.Sp_SV_VariantDiscovery_Query_Result_API');
        
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

module.exports = {centerList,varReqGenSp,varFreqResSp,storeReqDB,getVarDiscReqObj,getHPOParent,getHPOChild,varPhenReqSp,getAdminID,varPhenResultSp,varPhenStatsSp}