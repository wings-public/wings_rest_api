const sql = require('mssql')
const lodash = require("lodash")
const ind_meta_conf = require('../../config/ind_edit_conf.json');
const { result } = require('lodash');
// Including config to retrieve DB_BASE_INFO from config file
require('dotenv').config({ debug: process.env.DEBUG , path: './config/.env'});

// Define functions to interact with the database objects to fetch the Individuals.
const getIndividuals = async(user_id,center_id,piid,ind_id,db_conn) => {
    try {

        //console.log(`${user_id},${center_id},${piid},${ind_id}`)
        console.log("Executing stored procedure to get the individuals"+ user_id);
        // Execute stored procedure to fetch all the individuals without any filter on Individuals
        var result = await db_conn.request()
            .input('UserID', sql.Int, user_id)
            .input('CenterID',sql.Int,center_id)
            .input('PIID',sql.Int,piid)
            .input('IndividualID',sql.BigInt,ind_id)
            .execute('dbo.Sp_Individuals_Sel_ToDefine');
            var length = result.recordsets.length;
            return result.recordset
    } catch(err) {
        throw new Error(err.message)
    }
}

// Process the Individuals data and omit few keys from the final output
const processResult = async(res,ind_phen) => {
    try {
        var new_obj = []
        var new_phen_arr = []
        // ind_phen is an array of hashes
        if ( ind_phen != undefined && Object.keys(ind_phen).length !== 0 ) {
            for ( var idx in ind_phen ) {
                // get the phentype object
                var curr_obj = ind_phen[idx]
                // omit the keys which are not required in the response
                var new_phen_hash = lodash.omit(curr_obj,['UserID','DateAdd'])
                if ( 'HPOID' in new_phen_hash ) {
                    // Same HPOID and HPO_Name displayed twice.Including fix to only get the first element of the array
                    // HPOID: [ 'HP:0000924', 'HP:0000924' ]
                    // HPO_Name: ['Abnormality of the skeletal system','Abnormality of the skeletal system']
                    var hpo_id = new_phen_hash['HPOID'][0]
                    var hpo_name = new_phen_hash['HPO_Name'][0]
                    new_phen_hash['HPOID'] = hpo_id;
                    new_phen_hash['HPO_Name'] = hpo_name
                }
                //console.dir(new_phen_hash,{"depth":null})
                new_phen_arr.push(new_phen_hash)
            } 
        }

        // traverse the individual response array and fetch each object
        // res is an array of hashes
        for ( idx in res ) {
            var hash = res[idx]
            //console.dir(hash,{"depth":null})
            // omit the mentioned keys 
            var upd_hash = lodash.omit(hash,['Updatable','HostID','HostDesc'])
            upd_hash['phenotype'] = new_phen_arr;
            new_obj.push(upd_hash) 
        }
        //console.log("Logging the phenotype details....")
        
        //console.dir(ind_phen,{"depth":null})
        //console.log("Logging the individual array with added phen ")
        //console.dir(new_phen_arr,{"depth":null})

        return new_obj
    } catch(err) {
        throw new Error(err.message) 
    }
}

// Function to edit individual meta data
// Existing individual data has to be updated with the provided meta data 
const prepareIndData = async(ind_result,req_body) => {
    try {
        // ind_result contains existing individual meta data
        // omit the fields which are not required for update
        // fetch the keys of request body and traverse the keys.
        //console.log("Logging the function input")
        //console.dir(ind_result,{"depth":null})
        //console.dir(req_body,{"depth":null})
        var meta_names = Object.keys(req_body);
        //console.log(meta_names)
        var ind_curr_data = ind_result[0]

        for ( var idx in meta_names ) {
            var meta_name = meta_names[idx]
            //console.log(`meta_req_keyname:${meta_name}`)
            var upd_value = req_body[meta_name]
            //console.log(`upd_value:${upd_value}`)
            // fetch the db map name from the json object
            //console.dir(ind_meta_conf,{"depth":null})
            var db_name = ind_meta_conf['meta_map'][meta_name]
            //console.log(`db_name:${db_name}`)
            if ( db_name in ind_curr_data ) {
                ind_curr_data[db_name] = upd_value
            }
        }

        return ind_curr_data;
        // Update the values to ind_result

        // ind_result can be used to populate the stored procedure parameters
        // req_body contains the fields to be updated
    } catch(err) {
        throw new Error(err.message) 
    }
}
// Function to execute the stored procedure and update individual meta data
const editIndividual = async(user_id,center_id,piid,ind_id,upd_result,db_conn) => {
    try {
        var output_var = ""
        var result = await db_conn.request()
        .input('UserID', sql.Int, user_id)
        .input('CenterID',sql.Int,center_id)
        .input('PIID',sql.Int,piid)
        .input('IndividualID',sql.BigInt,ind_id)
        .input('IndividualFName',sql.VarChar(50),upd_result['IndividualFName'])
        .input('SampleID',sql.BigInt,-1)
        .input('LocalID',sql.Int,-1)
        .input('IndividualLName',sql.VarChar(50),upd_result['IndividualLName'])
        .input('IndividualBirthDate',sql.VarChar(200),upd_result['IndividualBirthDate'])
        .input('IndividualSex',sql.Int,upd_result['IndividualSex'])
        .input('IndividualStatus',sql.Int,upd_result['IndividualStatus'])
        .input('Relevant_Clinical_Info',sql.VarChar(400),upd_result['Relevant_Clinical_Info'])
        .input('Affected',sql.Int,null)
        .input('HostID',sql.Int,upd_result['HostID'])
        .output('feedbackOUT',sql.VarChar(100),output_var)
        .execute('dbo.Sp_Individual_Upd');
        //console.dir(result,{"depth":null})
        //console.log(output_var)
        return "success"
    } catch(err) {
        throw new Error(err.message) 
    }
}

// Execute stored procedure to get the phenotype added to individual provided as argument
const getIndPhenotype = async(user_id,center_id,ind_id,db_conn) => {
    try {

        //console.log(`${user_id},${center_id},${ind_id}`)
        // Execute stored procedure to fetch all the individuals without any filter on Individuals
        var result = await db_conn.request()
            .input('UserID', sql.Int, user_id)
            .input('CenterID',sql.Int,center_id)
            .input('IndividualID',sql.BigInt,ind_id)
            .input('HostID',sql.Int,-1)
            .execute('dbo.Sp_PhenBook_Individual_HPOs_Sel');
            var length = result.recordsets.length;
            //console.dir(result,{"depth":null})
            //console.log(length)
            //console.log(result.output)
            //console.dir(result.recordset)
            //return "success"
            return result.recordset
    } catch(err) {
        //console.log(err)
        throw new Error(err.message)
    }
}

// Execute stored procedure to get the families within the specific centerid and based on user id access
const getFamilies = async(user_id,center_id,piid,fam_id,db_conn) => {
    try {

        //console.log("----------------------------------------------------")
        //console.log(`${user_id},${center_id},${piid},${fam_id}`)
        // Execute stored procedure to fetch all the individuals without any filter on Individuals
        var result = await db_conn.request()
            .input('UserID', sql.Int, user_id)
            .input('CenterID',sql.Int,center_id)
            .input('PIID',sql.Int,piid)
            .input('FamilyID',sql.BigInt,fam_id)
            .execute('dbo.Sp_Families_sel_ToDefine');
            var length = result.recordsets.length;
            //console.dir(result,{"depth":null})
            //console.log(length)
            //console.log(result.output)

            //console.dir(result.recordset)
            //return "success"
            return result.recordset
    } catch(err) {
        //console.log(err)
        //console.log("------------------------------------")
        throw new Error(err.message)
    }
}

// Process the families data and omit few keys from the final output
const processFamResult = async(res,proband = null) => {
    try {
        var new_obj = []

        // traverse the family response array and fetch each object
        // res is an array of hashes
        for ( idx in res ) {
            var hash = res[idx]
            //console.dir(hash,{"depth":null})
            // omit the mentioned keys 
            var upd_hash = lodash.omit(hash,['Updatable','HostID','HostDesc'])
            new_obj.push(upd_hash)
            //console.log("Logging proband "+proband)
        }

        if ( proband != null ) {
            //var proband_hash = {};
            new_obj = lodash.find( new_obj,{'IndividualID' : proband})
            //console.dir(proband_hash,{"depth":null})
        } 

        return new_obj
    } catch(err) {
        throw new Error(err.message) 
    }
}

// function to execute the stored procedure to get the piid
const getPiid = async(center_id,user_id,db_conn) => {
    try {
        // Execute stored procedure to fetch all the piid for which this user has access
        var result = await db_conn.request()
            .input('UserID', sql.Int, user_id)
            .input('CenterID',sql.Int,center_id)
            .input('InputType',sql.Int,-1)
            .execute('dbo.Sp_PI_Sel');
            var length = result.recordsets.length;
            //console.dir(result,{"depth":null})
            //console.log(length)
            //console.log(result.output)
            //console.dir(result.recordset)
            //return "success"
            return result.recordset
    } catch(err) {
        throw new Error(err.message) 
    }
}

// Function to omit the keys from the object
const omitKeys = async(res,keysArr) => {
    try {
        var new_obj = []

        // traverse the family response array and fetch each object
        // res is an array of hashes
        for ( idx in res ) {
            var hash = res[idx]
            //console.dir(hash,{"depth":null})
            // omit the mentioned keys 
            var upd_hash = lodash.omit(hash,keysArr)
            new_obj.push(upd_hash) 
        }

        return new_obj
    } catch(err) {
        throw new Error(err.message) 
    }
}

// Function to execute the stored procedure to add a new family
const addNewFamily = async(piid,family_desc,host_id,user_id,center_id,db_conn) => {
    try {
        // Execute stored procedure to fetch all the piid for which this user has access

        //console.log("Executing stored procedure to create new family with below parameters")
        //console.log(`${user_id},${center_id},${piid},${host_id},${family_desc}`)
        var result = await db_conn.request()
            .input('UserID', sql.Int, user_id)
            .input('CenterID',sql.Int,center_id)
            .input('PIID',sql.Int,piid)
            .input('HostID',sql.Int,host_id)
            .input('FamilyDesc',sql.VarChar(50),family_desc)
            .execute('dbo.Sp_Family_Ins');
            var length = result.recordsets.length;
            //console.dir(result,{"depth":null})

            var ind_id = ""
            //console.log(result)
            if ( result.recordset[0].FamilyID ) {
                ind_id = parseInt(result.recordset[0].FamilyID)
            }
            return ind_id
    } catch(err) {
        throw new Error(err.message) 
    }
}

// Function to get the details for member type
const getMemberType = async(db_conn) => {
    try {
        var result = await db_conn.request()
        .query('select FamilyMemberTypeID,FamilyMemberTypeName from dbo.Tbl_FamilyMemberType')
        if ( result.recordset ) {
            result = result.recordset
        }
        return result;
    } catch(err) {
        throw new Error(err.message)
    }
}

// Get the member id corresponding to the member type name
const getMemberID = async(mem_name,db_conn) => {
    try {
        var result = await db_conn.request()
        .input('input1', sql.VarChar(50), mem_name)
        .query('select FamilyMemberTypeID from dbo.Tbl_FamilyMemberType where FamilyMemberTypeName = @input1')
        if ( result.recordset ) {
            result = result.recordset[0].FamilyMemberTypeID
        }
        return result;
    } catch(err) {
        throw new Error(err.message)
    }
}

// Function to execute stored procedure and get the unassigned members
const getUnassignedMem = async(piid,host_id,member_id,user_id,center_id,db_conn) => {
    try {
        var result = await db_conn.request()
            .input('UserID', sql.Int, user_id)
            .input('CenterID',sql.Int,center_id)
            .input('PIID',sql.Int,piid)
            .input('HostID',sql.Int,host_id)
            .input('FamilyMemberTypeID',sql.Int,member_id)
            .execute('dbo.Sp_IndividualsForFamily_sel');
            var length = result.recordsets.length;
            //console.dir(result,{"depth":null})

            var ind_id = ""
            if ( result.recordset[0] ) {
                console.log(result.recordset)
            }
            return result.recordset
    } catch(err) {
        throw new Error(err.message)
    }
}

// Function to execute the stored procedure to assign the proband to the family
const assignProband = async(user_id,center_id,db_conn,family_id,ind_id,host_id) => {
    try {
        var member_name = 'Proband'
        var member_id = await getMemberID(member_name,db_conn)
        var node_key = 2;
        var fam_side = -1;
        // Step1  Create a table which will be used for table valued parameter
        // The column names should match with the columns defined in Pedigree_DataTable in WiNGS_Db_Dev 
        
        var pedigree_tvp = await createTVP();
        pedigree_tvp.rows.add(member_name,family_id,ind_id,member_id,fam_side,node_key,null,null,null,null,user_id)

        // execute stored procedure with the input and output parameters.
        var output_var = "";

        var result = await db_conn.request()
        .input('UserID', sql.Int, user_id)
        .input('CenterID',sql.Int,center_id)
        .input('IndividualID',sql.BigInt,ind_id)
        .input('FamilyID',sql.BigInt,family_id)
        .input('HostID',sql.Int,host_id)
        .input('PedigreeData',sql.TVP,pedigree_tvp)
        .output('feedback',sql.VarChar(100),output_var)
        .execute('dbo.Sp_Family_Proband_Ins');

        var output_val = result.output.feedback;
        //console.dir(result,{"depth":null})
        //console.log(output_var)
        return output_val;
        
    } catch(err) {
        throw new Error(err.message)
    }
}

const createTVP = async() => {
    try {
        var pedigree_tvp = new sql.Table;
        pedigree_tvp.create = true;
        pedigree_tvp.columns.add('FamilyMemberTypeName',sql.VarChar(50))
        pedigree_tvp.columns.add('FamilyID',sql.BigInt)
        pedigree_tvp.columns.add('IndividualID',sql.BigInt)
        pedigree_tvp.columns.add('FamilyMemberTypeID',sql.Int)
        pedigree_tvp.columns.add('Family_side',sql.Int)
        pedigree_tvp.columns.add('Node_Key',sql.Int)
        pedigree_tvp.columns.add('RelativeName',sql.VarChar(100))
        pedigree_tvp.columns.add('RelativeBirthdate',sql.DateTime)
        pedigree_tvp.columns.add('RelativeGender',sql.Int)
        pedigree_tvp.columns.add('RelativeStatus',sql.Int)
        pedigree_tvp.columns.add('UserID',sql.Int)
        return pedigree_tvp;
    } catch(err) {
        throw new Error(err.message)
    }
}

const assignFamMember = async(user_id,center_id,db_conn,family_id,ind_id,host_id,mem_type) => {
    try {
        // default value set to Father node_key
        var node_key = 0;
        if ( mem_type == "Mother" ) {
            node_key = 1;
        }
        var member_id = await getMemberID(mem_type,db_conn)

        var result = await db_conn.request()
        .input('UserID', sql.Int, user_id)
        .input('CenterID',sql.Int,center_id)
        .input('IndividualID',sql.BigInt,ind_id)
        .input('FamilyID',sql.BigInt,family_id)
        .input('HostID',sql.Int,host_id)
        .input('FamilyMemberTypeID',sql.Int,member_id)
        .input('RelativeName',sql.VarChar(10),null)
        .input('RelativeBirthdate',sql.VarChar(50),null)
        .input('RelativeGender',sql.Int,null)
        .input('RelativeStatus',sql.Int,null)
        .input('Node_Key',sql.Int,node_key)
        .input('Disease_TL',sql.VarChar(5),null)
        .input('Code_TL',sql.VarChar(5),null)
        .input('Hex_TL',sql.VarChar(5),null)
        .input('Disease_TR',sql.VarChar(5),null)
        .input('Code_TR',sql.VarChar(5),null)
        .input('Hex_TR',sql.VarChar(5),null)
        .input('Disease_BL',sql.VarChar(5),null)
        .input('Code_BL',sql.VarChar(5),null)
        .input('Hex_BL',sql.VarChar(5),null)
        .input('Disease_BR',sql.VarChar(5),null)
        .input('Code_BR',sql.VarChar(5),null)
        .input('Hex_BR',sql.VarChar(5),null)
        .execute('dbo.Sp_FamilyMember_Upd');

        //console.dir(result,{"depth":null})
        //console.log(output_var)
        return result;
    } catch(err) {
        throw new Error(err.message)
    }
}

const addPedigree = async(user_id,center_id,db_conn,family_id,host_id,members) => {
    try {

        // Step1  Create a table which will be used for table valued parameter
        // The column names should match with the columns defined in Pedigree_DataTable in WiNGS_Db_Dev 
        
        var pedigree_tvp = await createTVP();

        for ( var idx in members ) { 
            var mem_name = members[idx]
            var member_id = await getMemberID(mem_name,db_conn)
            var fam_side = -1;
            // default value set to Father node_key
            var node_key = 0;
            if ( mem_name == "Mother" ) {
                node_key = 1;
            }
            var ind_id = null;
            // Add rows for Father and Mother
            pedigree_tvp.rows.add(mem_name,family_id,ind_id,member_id,fam_side,node_key,null,null,null,null,user_id)
        }

        var result = await db_conn.request()
        .input('UserID', sql.Int, user_id)
        .input('CenterID',sql.Int,center_id)
        .input('FamilyID',sql.BigInt,family_id)
        .input('HostID',sql.Int,host_id)
        .input('PedigreeData',sql.TVP,pedigree_tvp)
        .execute('dbo.Sp_FamilyMembers_Ins');

        //console.dir(result,{"depth":null})
        //console.log(output_var)
        var output_val = result.output;
        return output_val;
        
    } catch(err) {
        throw new Error(err.message)
    }
}

const unassignRelative = async(user_id,center_id,db_conn,family_id,host_id,mem_type,ind_id) => {
    try {
        // default value set to Father node_key
        var node_key = 0;
        if ( mem_type == "Mother" ) {
            node_key = 1;
        }
        var member_id = await getMemberID(mem_type,db_conn)

        var result = await db_conn.request()
        .input('UserID', sql.Int, user_id)
        .input('CenterID',sql.Int,center_id)
        .input('Node_Key',sql.Int,node_key)
        .input('RelativeID',sql.BigInt,ind_id)
        .input('FamilyID',sql.BigInt,family_id)
        .input('HostID',sql.Int,host_id)
        .execute('dbo.Sp_FamilyMember_info_Del');

        //console.dir(result,{"depth":null})
        //console.log(output_var)
        return result;
    } catch(err) {
        throw new Error(err.message)
    }
}


// Function to check if the HPO term provided as input is a valid term
const validatePhenTerm = async(db_conn,hpo_id) => {
    try {
        //var change_db = await db_conn.changeUser({database : "WiNGS_BaseInfo_Db"})
        var status = 0;
        var query_string = `select HPOID from ${process.env.DB_BASE_INFO}.dbo.Tbl_HPO where HPOID = @input1`
        var result = await db_conn.request()
        .input('input1', sql.VarChar(10), hpo_id)
        //.query('select HPOID from WiNGS_BaseInfo_Db.dbo.Tbl_HPO where HPOID = @input1')
        .query(query_string)
        if ( result.recordset.length > 0  ) {
            status = 1;
            //result = result.recordset[0].HPOID || null
        }
        //("validateHPO Term")
        //console.dir(result,{"depth":null})
        return status;
    } catch(err) {
        throw new Error(err.message)
    }
}

// Function to interact with stored procedure to add phenotype to Individual
const addPhenotype = async(db_conn,user_id,center_id,host_id,ind_id,hpo_id,hpo_status) => {
    try {
        var output_var = "";
        //console.log(`${user_id},${center_id},${host_id},${ind_id},${hpo_id},${hpo_status}`)
        var result = await db_conn.request()
        .input('UserID', sql.Int, user_id)
        .input('CenterID',sql.Int,center_id)
        .input('IndividualID',sql.BigInt,ind_id)
        .input('HostID',sql.Int,host_id)
        .input('HPOID',sql.VarChar(10),hpo_id)
        .input('HPO_Status',sql.Int,hpo_status)
        .output('Success',sql.VarChar(100),output_var)
        .execute('dbo.Sp_PhenBook_Individual_HPOs_Ins');

        var output_val = result.output;
        //console.log("Logging the result --- addPhenotype")
        //console.dir(result,{"depth":null})
        return output_val;
    } catch(err) {
        throw new Error(err.message)
    }
}


// Function to interact with stored procedure to delete phenotype from Individual
const deletePhenotype = async(db_conn,user_id,center_id,host_id,ind_id,hpo_id,hpo_status) => {
    try {
        var output_var = "";
        //console.log(`${user_id},${center_id},${host_id},${ind_id},${hpo_id},${hpo_status}`)
        var result = await db_conn.request()
        .input('UserID', sql.Int, user_id)
        .input('CenterID',sql.Int,center_id)
        .input('IndividualID',sql.BigInt,ind_id)
        .input('HostID',sql.Int,host_id)
        .input('HPOID',sql.VarChar(10),hpo_id)
        .input('HPO_Status',sql.Int,hpo_status)
        .output('Success',sql.VarChar(100),output_var)
        .execute('dbo.Sp_PhenBook_Individual_HPOs_Del');

        var output_val = result.output;
        //console.log("Logging the result --- deletePhenotype")
        //console.dir(result,{"depth":null})
        return output_val;
    } catch(err) {
        throw new Error(err.message)
    }
}

// Function to check the gender of the Individual

const checkIndGender = async(mem_type,user_id,center_id,piid,ind_id,db_conn) => {
    try {
        var ind_result = await getIndividuals(user_id,center_id,piid,ind_id,db_conn);
 
        var ind_gender = ind_result[0]['IndividualSex'];
        var status = 1;
        if ( mem_type == "Father" ) {
            // Check for expected Gender for Father. 1 indicates Male
            if ( ind_gender != 1 ) {
                status = 0;
            }
        } else if (mem_type == "Mother" ) {
            // Check for expected Gender for Mother. 0 indicates Female 
            if ( ind_gender != 0 ) {
                status = 0;
            }
        }
        return status;
    } catch(err) {
        throw new Error(err.message)
    }
}

// Function to execute the stored proc and fetch the trios
const getTrios = async(user_id,center_id,piid,family_id,registered,db_conn) => {
    try {
        var result = await db_conn.request()
        .input('UserID', sql.Int, user_id)
        .input('CenterID',sql.Int,center_id)
        .input('PIID',sql.Int,piid)
        .input('FamilyID',sql.BigInt,family_id)
        .input('Registered',sql.Int,registered)
        .execute('dbo.Sp_GAP_Trios_Family_sel');
        return result.recordset;
    } catch(err) {
        throw new Error(err.message)
    }
}

// Function to get the filters defined for Trio
const getTrioFilter = async(user_id,analysis_type,db_conn) => {
    try {
        var result = await db_conn.request()
        .input('UserID', sql.Int, user_id)
        .input('AnalysisType',sql.VarChar(10),analysis_type)
        .execute('dbo.Sp_GAP_Filter_Set_Sel');
        return result.recordset;
    } catch(err) {
        throw new Error(err.message)
    }
}

// Function to get the conditions(hierarchy) for leaf nodes
const getFilterLeaf = async(user_id,filter_id,db_conn) => {
    try {
        var result = await getFilters(filter_id,user_id,db_conn);
        //console.dir(result,{"depth":null});
        var filterObj = await getFilterObj(result);
        var filterCond = await processFilterLeaf(filterObj);
        
        //return filterObj;
        return filterCond;
    } catch(err) {
        throw new Error(err.message);
    }
}

// Function to get the conditions for a specific filter
const getFilters = async(filter_id,user_id,db_conn) => {
    try {
        // Query has to be modified to restrict the result based on userID
        //var query_string = `select * from dbo.Tbl_Filter_SelectedItems where FilterID = @input1`
        var query_string = `select F.* from Tbl_GAP_Filter as G INNER JOIN Tbl_Filter_SelectedItems as F ON G.FilterID=F.FilterID where G.FilterID = @input1 and G.UserID = @input2`;

        var result = await db_conn.request()
        .input('input1', sql.Int, filter_id)
        .input('input2', sql.Int, user_id)
        .query(query_string)
        if ( result.recordset  ) {
            result = result.recordset;
        }
        return result;
    } catch(err) {
        throw new Error(err.message);
    }
}

// Function to process the filter db result and store in a node object
const getFilterObj = async(result) => {
    try {
        var filterObj = {};
        var leafs = [];
        for ( var idx in result ) {
            //console.log("IDX is "+idx);
            var tmpObj = {};
            var filter1 = result[idx];
            var level = filter1['Level'];
            //tmpObj['Level'] = filter1['Level'];
            tmpObj['Parent'] = filter1['Parent'];
            tmpObj['Condition'] = filter1['Condition'];
            tmpObj['Type'] = filter1['Type'];
            filterObj[level] = tmpObj;
            if (filter1['Condition'] == null ) {
                leafs.push(level);
            }
        }
        filterObj['leaf'] = leafs;
        //console.log(leafs);
        return filterObj;
    } catch(err) {
        throw new Error(err.message);
    }
}

// Calls getCondition for the leafs of the tree.
const processFilterLeaf = async(filterObj) => {
    try {
        var leafs = filterObj['leaf'];
        //var tmpCond = ""
        //var cond = await getCondition(2,filterObj,tmpCond);
        //console.log("Logging condition below----")
        //console.log(cond);

        var filterCond = {};
        for ( var idx in leafs ) {
            var tmpCond = ""
            var leaf = leafs[idx];
            //console.log("leaf "+leaf)
            var cond = await getCondition(leaf,filterObj,tmpCond);
            //console.log("Logging condition below----")
            //console.log(cond);
            filterCond[leaf] = cond;
        }

        //console.dir(filterCond,{"depth":null});
        return filterCond;
    } catch(err) {
        throw new Error(err.message);
    }
}

// Function to fetch the condition in parent for a leaf using recursion
async function getCondition(leaf,filterObj,condition) {
    //console.log("Logging leaf")
    //console.log(leaf)
    // Exit from the function when the condition does not have a parent
    if ( filterObj[leaf]['Parent'] === -1 ) {
        condition =  condition + " " +filterObj[leaf]['Condition'] + ")"
        //console.log(condition);
        return condition;
    }

    if ( filterObj[leaf]['Condition'] == null ) {
        var type1 = filterObj[leaf]['Type']
        leaf = filterObj[leaf]['Parent'];
        condition = condition +  type1 + "("
    } else {
        condition = condition + filterObj[leaf]['Condition'] + ")+" +filterObj[leaf]['Type'] + "(";
        leaf = filterObj[leaf]['Parent'];
        //console.log("else part ");
        //console.log(condition)
    }
    
    return await getCondition(leaf,filterObj,condition)

}


async function trioInheritReq(user_id,center_id,select_filter,filter_id,trio_local_id,inherit_type,db_conn) {
    try {
        var output_var = ""
        var result = await db_conn.request()
        .input('TrioLocalID',sql.VarChar(500),trio_local_id)
        .input('TrioCode',sql.VarChar(3),"")
        .input('IndividualID',sql.BigInt,0)
        .input('FilterID',sql.Int,filter_id)
        .input('Inheritance',sql.VarChar(50),inherit_type)
        .input('Selected_FiterItemLevels_CommaSep',sql.VarChar(200),select_filter)
        .input('UserID', sql.Int, user_id)
        .input('CenterID',sql.Int,center_id)
        .output('Output',sql.VarChar(100),output_var)
        .execute('dbo.Sp_GAP_Trio_Result_Variant_Inheritance');
        //console.dir(result,{"depth":null})
        //console.log(output_var)
        var output_val = result.output.Output;
        return output_val;
        //return "success"
    } catch(err) {
        throw new Error(err.message);
    }

}

async function trioInheritResp(user_id,center_id,trio_local_id,request_id,page_num,db_conn,host_id) {
    try {
        var output_var = ""
        console.log("Sending SP REquest-----------")
        console.log(`${user_id},${center_id},${trio_local_id},${request_id},${page_num}, ${host_id}`);
        var result = await db_conn.request()
        .input('CenterID',sql.Int,center_id)
        .input('UserID', sql.Int, user_id)
        .input('TrioLocalID',sql.VarChar(500),trio_local_id)
        .input('ProcID', sql.Int,request_id)
        .input('BatchID', sql.Int,page_num) // Page number provided
        .input('HostID', sql.Int,host_id)
        .output('JsonOutput',sql.VarChar(sql.MAX),output_var)
        .execute('dbo.Sp_GAP_Trio_Result_Variant_Inh_Batch');
        //console.dir(result,{"depth":null})
        //console.log(output_var)
        //console.log("trioInheritResp")
        
        var output_val = result.output.JsonOutput;
        //console.log(output_val)
        // convert JSON string to object
        var results = {'msg' : 'Results not yet ready'};
        if ( output_val != '' ) {
            results = JSON.parse(output_val);
        }
        return results;
        //return "success"
    } catch(err) {
        throw new Error(err.message);
    }

}

// Function to interact with stored procedure to get the family analysis options
const getFamAnalysisOpts = async(piid,mem_obj,host_id,user_id,center_id,db_conn) => {
    try {
        var output_var = "";
        //console.log(`${user_id},${center_id},${host_id},${ind_id},${hpo_id},${hpo_status}`)
        var result = await db_conn.request()
        .input('UserID', sql.Int, user_id)
        .input('CenterID',sql.Int,center_id)
        .input('HostID',sql.Int,host_id)
        .input('PIID',sql.Int,piid)
        .input('famMembers',sql.NVarChar(sql.MAX),mem_obj)
        .output('JsonOutput',sql.VarChar(sql.MAX),output_var)
        .execute('dbo.Sp_Family_AnalysisType_Sel');

        console.log(result);
        var output_val = result.output.JsonOutput;
        var results = {};
        if ( output_val != '' ) {
            results = JSON.parse(output_val);
        }
        
        return results;

    } catch(err) {
        throw new Error(err.message)
    }
}

const triggerPreProcessReq = async(reqBody,piid,host_id,user_id,center_id,db_conn) => {
    try {
        var output_var = "";
        console.dir(reqBody);
        console.log(`center_id:${center_id} user_id:${user_id} host_id:${host_id}`)
        var result = await db_conn.request()
        .input('jsonReq',sql.NVarChar(sql.MAX),JSON.stringify(reqBody))
        .input('CenterID',sql.Int,center_id)
        .input('UserID', sql.Int, user_id)
        .input('HostID', sql.Int, host_id)
        .output('feedbackOut',sql.VarChar(sql.MAX),output_var)
        .execute('dbo.Sp_Family_AnalysisType_Precompute');

        var output_val = result.output.feedbackOut;
        var results = {};
        if ( output_val != '' ) {
            results = JSON.parse(output_val);
            if ( 'message' in results ) {
                results = results['message'];
            }
        }

        return results;

    } catch(err) {
        throw new Error(err.message);
    }
}

const famPreprocessStatSp = async(family_local_id,host_id,user_id,center_id,db_conn) => {
    try {

        var output_var = "";
        console.log("Calling stored procedure Sp_Family_AnalysisType_Precompute_Status")
        console.log(`center_id:${center_id} user_id:${user_id} host_id:${host_id} family_local_id:${family_local_id}`)
        var result = await db_conn.request()
        .input('CenterID',sql.Int,center_id)
        .input('UserID', sql.Int, user_id)
        .input('HostID', sql.Int, host_id)
        .input('FamLocalID',sql.VarChar(500),family_local_id)
        .output('Resp',sql.NVarChar(sql.MAX),output_var)
        .execute('dbo.Sp_Family_AnalysisType_Precompute_Status');

        
        const output_val = result.output.Resp;
        var results = {};
        if ( output_val != '' ) {
            results = JSON.parse(output_val);
            if ( 'message' in results ) {
                results = results['message'];
            }
        }

        return results;

    } catch(err) {
        throw new Error(err.message);
    }
}

const familyFilterQuerySp = async(family_local_id,host_id,filter_id,filter_level,user_id,center_id,db_conn) => {
    try {
        var output_var = ""
        var result = await db_conn.request()
        .input('FamLocalID',sql.VarChar(500),family_local_id)
        .input('HostID',sql.Int,host_id)
        .input('IndividualID',sql.BigInt,0)
        .input('FilterID',sql.Int,filter_id)
        .input('Selected_FiterItemLevels_CommaSep',sql.VarChar(200),filter_level)
        .input('UserID', sql.Int, user_id)
        .input('CenterID',sql.Int,center_id)
        .output('Output',sql.VarChar(100),output_var)
        .execute('dbo.Sp_GAP_Family_Filter_Result_Variant_Sel_API');
        //console.dir(result,{"depth":null})
        //console.log(output_var)
        var output_val = result.output.Output;
        return output_val;
    } catch(err) {
        throw new Error(err.message);
    }
}

async function SVResultsQuery(req_body,db_conn) {
    try {
        var output_var = ""
        console.log("Sending SP REquest-----------")
        console.dir(req_body)
        var result = await db_conn.request()
        .input('jsonInput', sql.NVarChar(sql.MAX), JSON.stringify(req_body))
        .execute('dbo.Sp_SampleSV_Results_Paged');
        //console.dir(result,{"depth":null})
        //console.log(output_var)
        //console.log("trioInheritResp")
    
   
        var output_val = result.recordset.length > 0 ? result.recordset[0].ResponseJSON : null;
        console.log(output_val);
        //console.log(output_val)
        // convert JSON string to object
        var results = {'msg' : 'Results not yet ready'};
        if ( output_val != '' ) {
            results = JSON.parse(output_val);
        }
        console.log(results);
        return results;
        //return "success"
    } catch(err) {
        throw new Error(err.message);
    }

}

module.exports = {getIndividuals,processResult,prepareIndData,editIndividual,getIndPhenotype,getFamilies,processFamResult,getPiid,omitKeys,addNewFamily,getMemberType,getMemberID,getUnassignedMem, assignProband,assignFamMember,addPedigree,addPhenotype,deletePhenotype,validatePhenTerm,checkIndGender,getTrios,getTrioFilter,getFilterLeaf,trioInheritReq,trioInheritResp,getFamAnalysisOpts,triggerPreProcessReq,famPreprocessStatSp,familyFilterQuerySp,SVResultsQuery,unassignRelative}