/**
 * @swagger
 * paths:
 *   /populations:
 *     get:
 *       summary: Get the defined Populations for the specific PIID and hostID 
 *       security:
 *         - jwt: []
 *       tags: [SV Population-Data Collection]
 *       description: Retrieve the defined populations.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/host'           
 *                 - $ref: '#/components/schemas/piid'  
 *       responses: 
 *         "200":
 *           description: A list of Populations
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/samp_dis_SV'     
 *         "401":
 *           description: Unauthorized
 *   /newPopulation:
 *     post:
 *       summary: Post the info for new Population
 *       security:
 *         - jwt: []
 *       tags: [SV Population-Data Collection]
 *       description: Define a new population.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *                 allOf:
 *                   - $ref: '#/components/schemas/host'           
 *                   - $ref: '#/components/schemas/piid'
 *                   - $ref: '#/components/schemas/new_pop_SV'
 *       responses: 
 *         "200":
 *           description : "Success if population created correctly"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: object
 *                     properties:
 *                       message:
 *                         type: string
 *                         description: Response on population creation
 *                         example: Success
 *   /population/addIndividualSampl:
 *     post:
 *       summary: Add individual and files to Population
 *       security:
 *         - jwt: []
 *       tags: [SV Population-Data Collection]
 *       description: Add to population.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *                 allOf:
 *                   - $ref: '#/components/schemas/PopulationSample'
 *       responses: 
 *         "200":
 *           description: Successful operation
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/PopulationSampleResponse'
 *               examples:
 *                 example-1:
 *                   value:
 *                     message:
 *                       message: "Population updated successfully"
 *                       Already present in the population:
 *                         - individualID: 24052100001
 *                           fileID: 24052130001
 *                       Individual doesn not exists or doesnt have a SV_VCF sample: []
 *   /population/removeIndividualSample:
 *     post:
 *       summary: Remove individual and files from Population
 *       security:
 *         - jwt: []
 *       tags: [SV Population-Data Collection]
 *       description: Remove from population.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *                 allOf:
 *                   - $ref: '#/components/schemas/PopulationSample'
 *       responses: 
 *         "200":
 *           description: Successful operation
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/PopulationSampleUpdateResponse'
 *               examples:
 *                 example-1:
 *                   value:
 *                     message:
 *                       message: "Population updated successfully"
 *                       Removed individuals and samples from the population:
 *                         - individualID: 24052100001
 *                           fileID: 24052130001
 *                       Individuals or samples not found in the population: []
 *         "401":
 *           description: Unauthorized
 *   /population/populationFileFiltering:
 *     post:
 *       summary: Filter a specific file with given Population
 *       security:
 *         - jwt: []
 *       tags: [SV Population-Data Analysis]
 *       description: Submit SV file to filter with Population.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *                 allOf:
 *                   - $ref: '#/components/schemas/SV_pop_filter'
 *       responses: 
 *         "200":
 *           description : "Object with the request ID of the SV sample discovery request"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: object
 *                     properties:
 *                       request_id:
 *                         type: string
 *                         description: Request ID of the SV sample discovery request
 *                         example: 39279
 * components:
 *     schemas:
 *       Auth:
 *         allOf:
 *           - $ref: '#/components/schemas/user'
 *           - type: object
 *             required:
 *               - center_id
 *             properties:
 *               center_id:
 *                 type: integer
 *                 description: WiNGS Center ID
 *                 example: 3
 *       user:
 *         type: object
 *         required:
 *           - user_id
 *         properties:
 *           user_id:
 *             type: integer
 *             description: WiNGS User ID
 *             example: 1085
 *       host:
 *         type: object
 *         required:
 *           - host_id
 *         properties:
 *           host_id:
 *             type: integer
 *             description: Host in which the Individual is defined. 1=Local, 2=Cloud. Execute /hosts endpoint to get details on host_id
 *             example: 1
 *       piid:
 *         type: object
 *         required:
 *           - piid
 *         properties:
 *           piid:
 *             type: integer
 *             description: piid for which the user has access.Execute /piid endpoint to get details on piid
 *             example: 1085 
 *       new_pop_SV:
 *         type: object
 *         properties:
 *           description:
 *             type: String
 *             description: Description of your population 
 *             example: Controls
 *           seqType:
 *             type: String
 *             description: Sequencing type of the population
 *             example: WGS
 *       PopulationSample:
 *         type: object
 *         properties:
 *           host_id:
 *             type: integer
 *             example: 1
 *           piid:
 *             type: integer
 *             example: 1105
 *           PopulationID:
 *             type: integer
 *             example: 24052610016
 *           individualsAndSamples:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 individualID:
 *                   type: integer
 *                   example: 24052100001
 *                 fileID:
 *                   type: integer
 *                   example: 24052130001
 *         required:
 *           - host_id
 *           - piid
 *           - PopulationID
 *           - individualsAndSamples
 *       PopulationSampleResponse:
 *         type: object
 *         properties:
 *           message:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Population updated successfully"
 *               Already present in the population:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     individualID:
 *                       type: integer
 *                       example: 24052100001
 *                     fileID:
 *                       type: integer
 *                       example: 24052130001
 *               Individual doesn not exists or doesnt have a SV_VCF sample:
 *                 type: array
 *                 items:
 *                   type: object
 *       PopulationSampleUpdateResponse:
 *         type: object
 *         properties:
 *           message:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Population updated successfully"
 *               Removed individuals and samples from the population:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     individualID:
 *                       type: integer
 *                       example: 24052100001
 *                     fileID:
 *                       type: integer
 *                       example: 24052130001
 *               Individuals or samples not found in the population:
 *                 type: array
 *                 items:
 *                   type: object    
 *       SV_pop_filter:
 *         type: object
 *         required:
 *          - host_id
 *          - piid
 *          - PopulationID
 *          - fileID_to_filter
 *         properties:
 *           PopulationID:
 *             type: Integer
 *             example: 24052610016
 *           fileID_to_filter:
 *             type: Integer
 *             example: 24052130001  
 *           host_id:
 *             type: Integer
 *             example: 1
 *           piid:
 *             type: Integer
 *             example: 27
 *           chr:
 *             type: String
 *             example: "1"
 *           sv_type:
 *             type: String
 *             example: "DEL"
 *           start_pos:
 *             type: Integer
 *             example: 1000
 *           sv_len:
 *             type: String
 *             example: "<100"
 *           filter:
 *             type: String
 *             example: "PASS"
 *           gt:
 *             type: String
 *             example: "0/1"
 *           gene_name:
 *             type: String
 *             description: "Can be true or a real gene name"
 *             example: "BRCA1"
 *           OMIM_ID:
 *             type: String
 *             example: ""
 *           ACMG_class:
 *             type: Integer
 *             description: "Returns everything greater than the number inserted"
 *             example: 3
 */