const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const result = require('dotenv').config({
  debug: process.env.DEBUG,
  path: './config/.env',
});

const hostname = process.env.APP_HOST;
const port = process.env.APP_PORT;
const appUrl = process.env.APP_URL;

/* SWAGGER Documentation */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WiNGS REST API',
      version: '1.0',
      description:
        'WiNGS is a web based platform used for federated genome analysis in a privacy controlled manner.WINGS REST API is accessible only for registered WiNGS Users.APIs which are listed under the tag SV indicates Structural Variants.',
      /*license: {
          name: "MIT",
          url: "https://spdx.org/licenses/MIT.html",
        },*/
      contact: {
        name: 'WiNGS',
        url: 'https://wings-platform.org',
        email: 'nishkala.sattanathan@uantwerpen.be',
      },
    },
    components: {
      securitySchemes: {
        jwt: {
          type: 'http',
          scheme: 'Bearer',
          in: 'header',
          bearerFormat: 'JWT',
        },
      },
    },
    cors: {
      optionsSuccessStatus: 200,
      origin: [`https://${hostname}`],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE',
      exposedHeaders: true,
      preflightContinue: false,
    },

    servers: [
      {
        //url: `http://${hostname}:${port}`,
        url: `${appUrl}`,
      },
    ],
  },
  apis: [
    './src/api_docs/swagger/auth_swagger.js',
    './src/api_docs/swagger/ind_fam_swagger.js',
    './src/api_docs/swagger/trio_swagger.js',
    './src/api_docs/swagger/sv_trio_swagger.js',
    './src/api_docs/swagger/samp_disc_swagger.js',
    './src/api_docs/swagger/sv_samp_disc_swagger.js',
    './src/api_docs/swagger/fam_analysis_swagger.js',
    './src/api_docs/swagger/sv_pop_swagger.js',
    './src/api_docs/swagger/var_disc_swagger.js',
    './src/api_docs/swagger/sv_var_disc_swagger.js'
  ],
  //basePath: '/api', // the basepath of your endpoint
};

/* SWAGGER Documentation */

module.exports = {
  spec() {
    return swaggerJSDoc(options);
  },
};
