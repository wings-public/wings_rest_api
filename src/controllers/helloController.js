

const loginMsg = async(req,res,next) => {
    try {
        console.log("TRY Step2 - loginMsg function");
        res.json({"message":"Hello! Welcome to WiNGS REST API"});
    } catch(err) {
        var err1 = {'code':400,'msg':err}
        console.dir(err,{"depth":null})
        next(`${err1}`)
    }
}

module.exports = {loginMsg}