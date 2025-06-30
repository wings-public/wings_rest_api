const verifyHeader = async(req,res,next) => {
    try {
        //console.log(req.headers);
        const bearerHeader = req.headers['authorization']
        if(typeof bearerHeader != 'undefined') {
            const bearer = bearerHeader.split(' ')
            const token = bearer[1]
            req.token = token
            // Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client : next() is not needed in this context
            //next();
        } else {
            var err = {'code': 401, 'msg' : 'Unauthorized'};
            //throw err;
        }
    } catch(err) {
        throw err;
    }
}

module.exports = {verifyHeader}