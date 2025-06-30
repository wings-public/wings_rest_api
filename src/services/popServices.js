const sql = require('mssql')
const lodash = require("lodash")
const ind_meta_conf = require('../../config/ind_edit_conf.json');
const { result } = require('lodash');
// Including config to retrieve DB_BASE_INFO from config file
require('dotenv').config({ debug: process.env.DEBUG , path: './config/.env'});

// Define functions to interact with the database objects to fetch the Individuals.
const createPopulation = async(piid,user_id,center_id,host_id,description,seqType,db_conn) => {
    try {

        console.log(`${user_id},${center_id},${piid},${description},${seqType}`)
        // Execute stored procedure to fetch all the individuals without any filter on Individuals
        var result = await db_conn.request()
            .input('CenterID',sql.Int,center_id)
            .input('PIID',sql.Int,piid)
            .input('UserID',sql.Int,user_id)
            .input('HostID',sql.Int,host_id)
            .input('PopulationDesc',sql.NVarChar(150),description)
            .input('seqType',sql.NVarChar(50),seqType)
            .execute('dbo.Sp_Population_Ins');
            console.log("AFTER SP");
            console.log(result);
            const firstRecordset = result.recordsets[0];
            if (firstRecordset && firstRecordset.length > 0) {
                const feedbackMessage = firstRecordset[0].Message;
    
                // Check if the feedback message is "Success"
                if (feedbackMessage && feedbackMessage.includes('Feedback: Success')) {
                    console.log('Success');
                    return 'Success';
                } else {
                    console.log('Feedback is not success:', feedbackMessage);
                    return 'Failure';
                }
            } else {
                console.log('No feedback message found');
                return 'Failure';
            }
            
    } catch(err) {
        throw new Error(err.message)
    }
}

const getPopulationsPIID = async(piid,host_id,user_id,center_id,db_conn) => {
    try {

        //console.log(`${user_id},${center_id},${piid},${ind_id}`)
        // Execute stored procedure to fetch all the individuals without any filter on Individuals
        var result = await db_conn.request()
            .input('CenterID',sql.Int,center_id)
            .input('PIID',sql.Int,piid)
            .input('HostID',sql.Int,host_id)    
            .execute('dbo.SP_SV_Pop_Sel');
            console.log(result);
            const responseJson = result.recordset.length > 0 ? result.recordset[0].ResponseJSON : null;
            const parsedResponse = responseJson ? JSON.parse(responseJson) : null;
            return parsedResponse;
            //return result
    } catch(err) {
        throw new Error(err.message)
    }
}

const addIndSamp = async(req_body,db_conn) => {
    try {

        //console.log(`${user_id},${center_id},${piid},${ind_id}`)
        // Execute stored procedure to fetch all the individuals without any filter on Individuals
        console.log(req_body);
        var result = await db_conn.request()
            .input('jsonInput', sql.NVarChar(sql.MAX), JSON.stringify(req_body))
            .execute('dbo.Sp_Population_Ins_Individ_FileID');
            console.log(result);
            const responseJson = result.recordset.length > 0 ? result.recordset[0].ResponseJSON : null;
            const parsedResponse = responseJson ? JSON.parse(responseJson) : null;
            return parsedResponse;
            //return result
    } catch(err) {
        throw new Error(err.message)
    }
}

const removeIndSamp = async(req_body,db_conn) => {
    try {

        //console.log(`${user_id},${center_id},${piid},${ind_id}`)
        // Execute stored procedure to fetch all the individuals without any filter on Individuals
        console.log(req_body);
        var result = await db_conn.request()
            .input('jsonInput', sql.NVarChar(sql.MAX), JSON.stringify(req_body))
            .execute('dbo.Sp_Population_Des_Individ_FileID');
            console.log(result);
            const responseJson = result.recordset.length > 0 ? result.recordset[0].ResponseJSON : null;
            const parsedResponse = responseJson ? JSON.parse(responseJson) : null;
            return parsedResponse;
            //return result
    } catch(err) {
        throw new Error(err.message)
    }
}

async function sampDiscReq(user_id,center_id,host_id,samp_id,file_id,ref_build_type,select_filter,filter_id,db_conn) {
    try {
        var output_var = ""
        var result = await db_conn.request()
        .input('SampleID',sql.VarChar(20),samp_id)
        .input('FileID',sql.VarChar(20),file_id)
        //.input('IndividualID',sql.BigInt,0)
        .input('FilterID',sql.Int,filter_id)
        .input('Selected_FiterItemLevels_CommaSep',sql.VarChar(200),select_filter)
        .input('UserID', sql.Int, user_id)
        .input('CenterID',sql.Int,center_id)
        .input('HostID',sql.Int,host_id)
        .input('RefBuild',sql.VarChar(20),ref_build_type)
        .output('Output',sql.VarChar(100),output_var)
        .execute('dbo.Sp_Filter_Result_Variant_Sel_API');
        //console.dir(result,{"depth":null})
        //console.log(output_var)
        var output_val = result.output.Output;
        console.dir(output_val);
        return output_val;
        //return "success"
    } catch(err) {
        throw new Error(err.message);
    }

}

async function SVsampDiscReq(req_body,db_conn) {
    try {
        
        console.log(req_body);
        var result = await db_conn.request()
        .input('jsonInput', sql.NVarChar(sql.MAX), JSON.stringify(req_body))
        .execute('dbo.Sp_SV_Filter_FileID');
        //console.dir(result,{"depth":null})
        //console.log(output_var)
        const responseJson = result.recordset.length > 0 ? result.recordset[0].ResponseJSON : null;
        const parsedResponse = responseJson ? JSON.parse(responseJson) : null;
        return parsedResponse;
        //return "success"
    } catch(err) {
        throw new Error(err.message);
    }

}

module.exports = {createPopulation,getPopulationsPIID,SVsampDiscReq,addIndSamp,removeIndSamp}