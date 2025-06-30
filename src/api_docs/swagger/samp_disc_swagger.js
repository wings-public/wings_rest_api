/**
 * @swagger
 * paths:
 *    /samples:
 *     get:
 *       summary: Get the defined samples and files for the specific PIID and hostID 
 *       security:
 *         - jwt: []
 *       tags: [Sample Discovery-Data Analysis]
 *       description: Retrieve the defined samples and files.
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
 *           description : "A list of samples and files with details on the reference build"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/samp_dis'     
 *         "401":
 *           description : "Unauthorized"
 *    /samples/filter:
 *     get:
 *       summary: Fetch the filters(ID) which are available for this User, specific to Sample Discovery
 *       security:
 *         - jwt: []
 *       tags: [Sample Discovery-Data Analysis]
 *       description: Filters can be created only using WiNGS UI. This API is used to fetch the defined filters.
 *       responses: 
 *         "200":
 *           description : "A list of filters created by this user"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/samp_filter'     
 *         "401":
 *           description : "Unauthorized"
 *    /samples/filter/leaf:
 *     post:
 *       summary: Fetch the leaf ID with the corresponding condition for the specific filter tree ID 
 *       security:
 *         - jwt: []
 *       tags: [Sample Discovery-Data Analysis]
 *       description: Leaf ID with the conditions. Indicates pass/fail side of the branch. Conditions are grouped from leaf condition to the root branch of the tree
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 filter_id:
 *                   type: integer
 *                   example: 5300
 *       responses: 
 *         "200":
 *           description : "Object with the leaf ID and condition"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: object
 *                     example:
 *                       "2" : "pass( Chrom = 2, start pos:1, end pos:242193529)"
 *                       "4" : "pass(Allelle frequency>0.2)+fail( Chrom = 2, start pos:1, end pos:242193529)"
 *                       "5": "fail(Type of Effect=Missense variant)+fail(Allelle frequency>0.2)+fail( Chrom = 2, start pos:1, end pos:242193529)"
 *                       "6": "pass(Type of Effect=Missense variant)+fail(Allelle frequency>0.2)+fail( Chrom = 2, start pos:1, end pos:242193529)"
 *                     additionalProperties: true
 *         "401":
 *           description : "Unauthorized"
 *    /samples/discovery:
 *     post:
 *       summary: Launch sample discovery request for the specific SampleID and FileID.
 *       security:
 *         - jwt: []
 *       tags: [Sample Discovery-Data Analysis]
 *       description: Request ID is returned
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 filter_id:
 *                   type: integer
 *                   example: 5300
 *                 host_id:
 *                   type: integer
 *                   example: 1
 *                 samp_id:
 *                   type: integer
 *                 file_id:
 *                   type: integer
 *                 ref_build_type:
 *                   type: string
 *                   example: hg19
 *                 filter_level:
 *                   type: string
 *                   example: 2
 *                   description: Comma separated filter_level supported
 *       responses: 
 *         "200":
 *           description : "Object with the request ID of the sample discovery request"
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
 *                         description: Request ID of the sample discovery request
 *                         example: 39279
 *         "401":
 *           description: "Unauthorized" 
 *    /samples/discovery/results?:
 *     get:
 *       summary: Retrieve results for the sample discovery request based on the request id.
 *       security:
 *         - jwt: []
 *       tags: [Sample Discovery-Data Analysis]
 *       description: Fetch Results(variants). Additional details are included in the Responses section below.
 *       parameters:
 *         - in: query
 *           name: request_id
 *           type: integer
 *           required: true
 *           example: 2547
 *           description: Request id  
 *         - in: query
 *           name: local_id
 *           type: string
 *           required: true
 *           example: dnaEH6m
 *           description: local ID  
 *         - in: query
 *           name: page
 *           type: integer
 *           default: 1
 *           description: Page number of the results.  
 *       responses: 
 *         "200":
 *           description : |
 *             - Results are paginated to handle the response efficiently. 100 variants are displayed in each page
 *             - current_page,next_page,last_page will be "" when the results status is 'not ready' or 'expired'
 *             - current_page,next_page will have page URL when status is 'ready. last_page will be true or false
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: object
 *                     properties:
 *                       meta:
 *                         type: object
 *                         description: meta object with page details
 *                         properties:
 *                           current_page:
 *                             type: string
 *                             example: http://localhost:5000/samples/discovery/results?page=2
 *                           next_page:
 *                             type: string
 *                             example: http://localhost:5000/samples/discovery/results?page=3
 *                           last_page:
 *                             type: string
 *                             example: "true OR false"
 *                       results:
 *                         type: array
 *                         items:
 *                           additionalProperties:
 *                             type: object
 *                           example:
 *                             var1: var1_val  
 *                       status:
 *                         type: string
 *                         example: ready OR not ready OR expired
 *         "401":
 *           description: "Unauthorized" 
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
 *       indid:
 *         type: object
 *         required:
 *           - ind_id
 *         properties:
 *           ind_id:
 *             type: integer
 *             description: WiNGS defined IndividualID for which this action has to be executed
 *             example: 202206010002
 *       famid:
 *         type: object
 *         required:
 *           - ind_id
 *         properties:
 *           family_id:
 *             type: integer
 *             description: WiNGS defined FamilyID for which this action has to be executed
 *             example: 202206010002 
 *       samp_dis:
 *         type: object
 *         properties:
 *           SampleID:
 *             type: Integer
 *             description: WiNGS Generated ID for the sample
 *             example: 21062520001
 *           SampleLocalID:
 *             type: String
 *             description: Local ID for the Sample 
 *             example: dnaEH6f
 *           IndividualID:
 *             type: Integer
 *             description: WiNGS generated ID for the Individual
 *             example: 21062500001
 *           IndividualLocalID:
 *             type: String
 *             description: Local ID for the Individual 
 *             example: dnaEH6f
 *           SampleFileID:
 *             type: Integer
 *             description: File ID(VCF or gVCF file ID) added to this Sample
 *             example: 22101230003
 *           ReferenceBuildName:
 *             type: String
 *             description: Genome assembly of the trio
 *             example: hg19 (GRCh37)
 *       samp_filter:
 *         type: object
 *         properties:
 *           FilterID:
 *             type: Integer
 *             description: Filter ID of the Sample Discovery Filter Tree defined in WiNGS UI
 *             example: 5300
 *           FilterName:
 *             type: String
 *             description: Filter Name of the  Filter Tree defined in WiNGS UI
 *             example: api_filter1 
 *           Description:
 *             type: String
 *             description: Description of the  Filter Tree defined in WiNGS UI
 *             example: "Filter defined in WiNGS UI" 
 *           CreatedDate:
 *             type: String
 *             description: Filter creation timestamp
 *             example: 2022-10-18T00:00:00.000Z
 *           BasedOnIndividual:
 *             type: Integer
 *             description: not relevant for this filter
 *             example: 0
 *       trio_filter_leaf:
 *         type: object
 *         properties:
 *           default:
 *             type: string
 *           additionalProperties:
 *             type: string
 *           example:
 *             "2" : "pass( Chrom = 2, start pos:1, end pos:242193529)"
 *       ind_edit:
 *         type: object
 *         properties:
 *           first_name:
 *             type: String
 *             description: First Name of Individual
 *             example: FName
 *           last_name:
 *             type: String
 *             description: Last name of Individual
 *             example: LName
 *           clinical_info:
 *             type: String
 *             description: Related clinical details for the Individual
 *             example: seizure history
 *           date_of_birth:
 *             type: Date
 *             description: Birthdate of the Individual
 *             example: 2002/12/04
 *           gender:
 *             type: Integer
 *             description: Gender of Individual created in WiNGS.0=Female,1=Male,null=Not Specified
 *             example: 0
 *           status:
 *             type: Integer
 *             description: Alive/Dead status of the Individual.0=Dead,1=Alive,null=Not specified
 *             example: 0
 *       ind_phen:
 *         allOf:
 *           - $ref: '#/components/schemas/host'
 *           - $ref: '#/components/schemas/indid'
 *           - type: object
 *             required:
 *               - hpo_id
 *               - hpo_status
 *             properties:
 *               hpo_id:
 *                 type: string
 *                 description: HPO Term to be added
 *                 example: HP:0001276
 *               hpo_status:
 *                 type: integer
 *                 description: todo
 *                 example: 1
 *       family:
 *         type: object
 *         properties:
 *           FamilyID:
 *             type: Integer
 *             description: ID of Family created in WiNGS
 *             example: 21062500001
 *           FamilyDesc:
 *             type: String
 *             description: Description of family added during creation
 *             example: history of seizures with intellectual disability
 *           UserID:
 *             type: Integer
 *             description: User ID of WiNGS user who performed the last update
 *             example: 23
 *           IndividualID:
 *             type: Integer
 *             description: ID of Individual created in WiNGS
 *             example: 21062500001
 *           LocalID:
 *             type: String
 *             description: free text included to identify the Individual
 *             example: SanDiego-dna372378
 *           IndividualFName:
 *             type: String
 *             description: First Name of Proband added to family
 *             example: Las 
 *           IndividualLName:
 *             type: String
 *             description: Last Name of Proband added to family
 *             example: John
 *           PIID:
 *             type: Integer
 *             description: PI ID of the center in which this Family was defined
 *             example: 1105
 *           DateAdd:
 *             type: Date
 *             description: Date when the Family was created in WiNGS
 *             example: 2022/05/03
 *       mem_type:
 *         type: object
 *         properties:
 *           FamilyMemberTypeID:
 *             type: Integer
 *             enum: [1,2]
 *           FamilyMemberTypeName:
 *             type: string
 *             enum: [Father,Mother]
 *       inh_resp1:
 *         type: object
 *         properties:
 *           message:
 *             type: object
 *             properties:
 *               meta:
 *                 type: object
 *                 description: Page details
 *                 properties:
 *                   current_page:
 *                     type: string
 *                     example: http://localhost:5000/trios/inheritance/results?page=12
 *                   next_page:
 *                     type: string
 *                     example: ""
 *                   last_page:
 *                     type: string
 *                     example: "true"
 *               results:
 *                 type: array
 *                 items:
 *                   additionalProperties:
 *                     type: object
 *                   example:
 *                     var1: var1_val  
 *                 status:
 *                   type: string
 *                   example: ready
 *       inh_resp2:
 *         type: object
 *         properties:
 *           message:
 *             type: object
 *             properties:
 *               meta:
 *                 type: object
 *                 description: Page details
 *                 properties:
 *                   current_page:
 *                     type: string
 *                     example: ""
 *                   next_page:
 *                     type: string
 *                     example: ""
 *                   last_page:
 *                     type: string
 *                     example: ""
 *               results:
 *                 type: array
 *                 items:
 *                   additionalProperties:
 *                     type: object
 *                   example:
 *                     var1: var1_val  
 *                 status:
 *                   type: string
 *                   example: not ready
 */
