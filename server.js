// npm module for running the api 
var express = require('express');
var cors = require('cors')
var bodyParser = require("body-parser");
// swagger modules
//const swaggerSpec = require('./config/swagger_setup_bkp').spec();
const swaggerUi = require("swagger-ui-express");

// Module for database connectivity to mssql server
var sql = require("mssql");
// module for generating tokens
const jwt = require('jsonwebtoken');
const {db_config}  = require('./config/db_conf');
//smal check
const result = require('dotenv').config({ debug: process.env.DEBUG , path: './config/.env'});

var authRoutes = require('./src/routes/authRoutes').authRoutes;
var helloRoutes = require('./src/routes/helloRoutes').helloRoutes;
var indRoutes = require('./src/routes/indRoutes').indRoutes;
var centerRoutes = require('./src/routes/centerRoutes').centerRoutes;
var sampRoutes = require('./src/routes/sampRoutes').sampRoutes;
var varDiscRoutes = require('./src/routes/varDiscRoutes').varDiscRoutes;
var verifyHeader = require('./src/auth/tokenFuncs').verifyHeader
var popRoutes = require('./src/routes/popRoutes').popRoutes
var svVarDiscRoutes = require('./src/routes/svVarDiscRoutes').svVarDiscRoutes;
const {requestLogger, errorLogger}  = require('./src/controllers/loggerMiddleware.js');
const hostname = process.env.APP_HOST;
const port = process.env.APP_PORT;

const app = express();
//app.use(cors());
//const swaggerSpec = require('./config/swagger_setup_bkp').spec(); 
const swaggerSpec = require('./config/swagger_setup').spec(); 
// Currently API requests are not made from browsers.
// Browser requests from domains(different origin) not included in the below cors list will not be allowed
// Setting CORS will not affect requests from scripts.
// added CORS lines
app.use(
  cors({origin: ['http://localhost:5000', 'http://127.0.0.1:5000','https://dev.wings-platform.org/','https://dev.wings-platform.org/rest-api/', 'https://wings.esat.kuleuven.be/rest-api/']})
  //cors({origin: ['http://localhost:5000', 'http://127.0.0.1:5000','http://localhost:5000','http://localhost:5000/rest-api/', 'http://localhost:5000/rest-api/']})
);


const morgan = require('morgan');
//const swaggerUi = require("swagger-ui-express");


//instantiate a connection pool
const appPool = new sql.ConnectionPool(db_config);





// built-in middleware function to parse the incoming requests with JSON payloads.
// Content-Type of requests are checked.
app.use(express.json());


app.use(morgan('combined'))

///////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// CODE WORK FLOW ////////////////////////////////////////////
////////////////////// AUTHOR : Nishkala Sattanathan //////////////////////////////////////////
// 1.express --> MiddleWare verifyHeader --> Checks Header Token -> next middleware
// 2. Routes -> example: indRoutes -> verifyToken middleware -> next -> controller function
// 3. Controllers -> Calls Services function -> Returns result to controllers
// 4. Controllers -> Sends response to user
// 5. Error -> Last middleware -> next(err)
///////////////////////////////////////////////////////////////////////////////////////////////

//Testing-Function gets executed for every request this app received.
app.use((req, res, next) => {
    console.log('Time:', Date.now())
    console.log("Send request for verify header")
    verifyHeader(req,res,next)
    //console.log("Verify Header - Done");
    //verifyHeader()
    //console.log("Token is ")
    //console.log(req.token)
    next()
})

try {
  authRoutes(app);
  app.use(requestLogger);
  helloRoutes(app);
  indRoutes(app);
  sampRoutes(app);
  varDiscRoutes(app);
  centerRoutes(app);
  popRoutes(app);
  svVarDiscRoutes(app);
} catch (err) {
  console.log("Error in routes"+err);
}

// Include middleware for swagger 
app.use(
  "/api-docs",
  swaggerUi.serve,
  // swagger options are defined
  swaggerUi.setup(swaggerSpec)
);

// Connect to the sql pool and start the webserver
appPool.connect().then(function(pool) {
    app.locals.db = pool;
    //Binds and listens for connections in the mentioned host and port.
    /*app.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    });*/
    app.listen(port, () => {
        console.log(`Server running at http://${port}/`);
    });
});

// Error handling middleware
/*app.use((err, req, res, next) => {
    console.error(err.stack)
    var code = err.code || 500
    res.status(code).json({error : err.msg||`${err}`})
})*/

// error-handling middleware should be defined last, after the other app.use and route calls.

app.use(errorLogger);

// catch the uncaught errors that weren't wrapped in a domain or try catch statement
// do not use this in modules, but only in applications, as otherwise we could have multiple of these bound
process.on('uncaughtException', function(err) {
  // handle the error safely
  console.log("Was there any uncaught exception that was caught here. ");
  console.log(err)
})

app.get('/', (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers['x-original-host'] || req.headers.host;
    res.send(`Welcome - Node and express server is running on host ${host} port ${port}`)
});