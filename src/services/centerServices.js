const sql = require('mssql')
const lodash = require("lodash")

const getHosts = async(db_conn,center_id) => {
    try {
        var result = await db_conn.request()
        .input('input1', sql.Int, center_id)
        .query('select HostID,IPCenter from dbo.Tbl_Center_Host where CenterID = @input1')
        return result;
    } catch(err) {
        throw err;
    }
}

module.exports = {getHosts}