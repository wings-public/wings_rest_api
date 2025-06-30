/**
 * @swagger
 * paths:
 *    /families/analysis/options:
 *     get:
 *       summary: Get the possible analysis for a specific family members based on the sequence type, reference build and file type 
 *       security:
 *         - jwt: []
 *       tags: [Family-Data Analysis]
 *       description: Retrieve the possible options for analysis
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/family_members' 
 *                 - $ref: '#/components/schemas/host' 
 *                 - $ref: '#/components/schemas/piid'  
 *       responses: 
 *         "200":
 *           description : "A list of possible analysis grouped based on the sequence type, reference build and file type"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/fam_ana_opts'     
 *         "401":
 *           description : "Unauthorized"
 *    /families/preprocessing:
 *     post:
 *       summary: Send request to compute shared variants for the specific family analysis
 *       security:
 *         - jwt: []
 *       tags: [Family-Data Analysis]
 *       description: Precomputation request
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/family_code' 
 *                 - $ref: '#/components/schemas/affected_mem' 
 *                 - $ref: '#/components/schemas/unaffected_mem' 
 *                 - $ref: '#/components/schemas/host' 
 *                 - $ref: '#/components/schemas/piid'  
 *       responses: 
 *         "200":
 *           description : "Send request to compute shared variants for the specific family analysis"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/fam_ana_opts'     
 *         "401":
 *           description : "Unauthorized"
 *    /families/preprocessing/status/{familyLocalID}:
 *     get:
 *       summary: Track status of the preprocessing request
 *       parameters:
 *         - in: query
 *           name: host_id
 *           type: integer
 *           default: 1
 *           description: Host ID in which the family analysis is defined
 *         - in : path
 *           name: familyLocalID
 *           default: "PANEL-hg19-VCF-CANCER3"
 *           description: Family Analysis Code
 *           schema:
 *             type: String
 *       security:
 *         - jwt: []
 *       tags: [Family-Data Analysis]
 *       description: Precomputation request status
 *       responses: 
 *         "200":
 *           description : "Send request to compute shared variants for the specific family analysis"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/fam_precomp_stat'     
 *         "401":
 *           description : "Unauthorized"
 *    /families/filter:
 *     get:
 *       summary: Fetch the filters(ID) which are available for this User, specific to Family Analysis
 *       security:
 *         - jwt: []
 *       tags: [Family-Data Analysis]
 *       description: Filters can be created only using WiNGS UI. This API is used to fetch the defined filters.
 *       responses: 
 *         "200":
 *           description : "A list of filters"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/trio_filter'     
 *         "401":
 *           description : "Unauthorized"
 *    /families/filter/leaf:
 *     post:
 *       summary: Fetch the leaf ID with the corresponding condition for the specific filter tree ID 
 *       security:
 *         - jwt: []
 *       tags: [Family-Data Analysis]
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
 *    /families/filter/query:
 *     post:
 *       summary: Send request to perform family analysis with the defined (functional) filters
 *       security:
 *         - jwt: []
 *       tags: [Family-Data Analysis]
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
 *                 family_local_id:
 *                   type: string
 *                   example: WES-hg19-VCF-1
 *                 filter_level:
 *                   type: string
 *                   example: 2
 *                   description: Comma separated filter_level supported
 *       responses: 
 *         "200":
 *           description : "Object with the request ID "
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
 *                         description: Request ID 
 *                         example: 39279
 *         "401":
 *           description: "Unauthorized" 
 *    /families/filter/query/results?:
 *     get:
 *       summary: Retrieve results for the  request based on the request id.
 *       security:
 *         - jwt: []
 *       tags: [Family-Data Analysis]
 *       description: Fetch Results(variants). Additional details are included in the Responses section below.
 *       parameters:
 *         - in: query
 *           name: request_id
 *           type: integer
 *           required: true
 *           example: 2547
 *           description: Request id  
 *         - in: query
 *           name: family_local_id
 *           type: string
 *           required: true
 *           example: WES-hg19-VCF-1
 *           description: Family local ID  
 *         - in: query
 *           name: host_id
 *           type: integer
 *           required: true
 *           example: 1
 *           description: Host ID
 *         - in: query
 *           name: page
 *           type: integer
 *           default: 1
 *           description: Page number of the results.  
 *       responses: 
 *         "200":
 *           description : |
 *             - Results are paginated to handle the response efficiently. 100 variants are displayed in each page
 *             - current_page,next_page,last_page will be "" when the results status is 'not ready'
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
 *                             example: http://localhost:5000/families/filter/query/results?page=2
 *                           next_page:
 *                             type: string
 *                             example: http://localhost:5000/families/filter/query/results?page=3
 *                           last_page:
 *                             type: string
 *                             example: "true OR false"
 *                       results:
 *                         type: array
 *                         items:
 *                           additionalProperties:
 *                             type: object
 *                           example:
 *                              "var_key": "1-114693436-G-A"
 *                              "annotations": {"var_key":"1-114693436-G-A","CLNSIG":"Conflicting_interpretations_of_pathogenicity|other","GENEINFO":"AMPD1:270"}
 *                              "vcfAnno": [{"_id":"22060530001-1-114693436-G-A","filter":"PASS","alt_cnt":2,"ref_depth":0},{"_id":"22060530002-1-114693436-G-A","filter":"PASS","alt_cnt":1,"ref_depth":27},{"_id":"22060530004-1-114693436-G-A","filter":"PASS","alt_cnt":1,"ref_depth":36}]
 *                       status:
 *                         type: string
 *                         example: ready OR not ready
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
 *       family_members:
 *         type: array
 *         required:
 *           - family_members
 *         properties:
 *           family_members:
 *             type: array
 *             description: Family members for analysis. Individual IDs has to be provided as input
 *             example: [21062500001,21062500002] 
 *       affected_mem:
 *         type: array
 *         required:
 *           - affected_mem
 *         properties:
 *           affected_mem:
 *             type: array
 *             description: Affected members for analysis.Individual IDs has to be provided as input
 *             example: [21062500001,21062500002] 
 *       unaffected_mem:
 *         type: array
 *         properties:
 *           unaffected_mem:
 *             type: array
 *             description: Unaffected Family members for analysis.Individual ID(s) has to be provided as input
 *             example: [21062500003] 
 *       family_code:
 *         type: object
 *         required:
 *           - family_local_id
 *         properties:
 *           family_local_id:
 *             type: integer
 *             description: Family analysis id 
 *             example: WES-hg19-VCF-2
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
 *       trio:
 *         type: object
 *         properties:
 *           TrioLocalID:
 *             type: String
 *             description: Local ID for the Trio in the format SequenceType-Assembly-fileType-FamilyID
 *             example: WES-hg19-VCF-24101210001
 *           TrioStatus:
 *             type: String
 *             description: Pre-compute status of the Trio
 *             example: completed 
 *           FamilyID:
 *             type: Integer
 *             description: Family ID for which the Trio is defined
 *             example: 24101210001
 *           FatherFileID:
 *             type: Integer
 *             description: File ID(VCF or gVCF file ID) of Father which was used for this Trio computation
 *             example: 22101230003
 *           MotherFileID:
 *             type: Integer
 *             description: File ID(VCF or gVCF file ID) of Mother which was used for this Trio computation
 *             example: 22101230002
 *           ProbandFileID:
 *             type: Integer
 *             description: File ID(VCF or gVCF file ID) of Proband which was used for this Trio computation
 *             example: 22101230001
 *           FatherID:
 *             type: Integer
 *             description: Individual ID of Father which was used for this Trio computation
 *             example: 22101200003
 *           MotherID:
 *             type: Integer
 *             description: Individual ID of Mother which was used for this Trio computation
 *             example: 22101200002
 *           ProbandID:
 *             type: Integer
 *             description: Individual ID of Proband which was used for this Trio computation
 *             example: 22101200001
 *           SampleID:
 *             type: Integer
 *             description: Sample ID related to Proband which was used in this trio
 *             example: 22101220001
 *           ReferenceBuildName:
 *             type: String
 *             description: Genome assembly of the trio
 *             example: hg19 (GRCh37)
 *           SeqTypeName:
 *             type: String
 *             description: Sequence Type of the trio
 *             example: WES
 *           PanelTypeName:
 *             type: String
 *             description: Panel Name-Applicable only for Panel sequencing type
 *             example: Cancer
 *       trio_filter:
 *         type: object
 *         properties:
 *           FilterID:
 *             type: Integer
 *             description: Filter ID of the Trio Filter Tree defined in WiNGS UI
 *             example: 5300
 *           FilterName:
 *             type: String
 *             description: Filter Name of the Trio Filter Tree defined in WiNGS UI
 *             example: trioapi_filter1 
 *           Description:
 *             type: String
 *             description: Description of the Trio Filter Tree defined in WiNGS UI
 *             example: "Trio filter defined in WiNGS UI" 
 *           CreatedDate:
 *             type: String
 *             description: Filter creation timestamp
 *             example: 2022-10-18T00:00:00.000Z
 *           BasedOnIndividual:
 *             type: Integer
 *             description: Indicates the Individual for which the trio filter was created. 0=>Proband, 1=>Father, 2=>Mother
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
 *       fam_ana_opts:
 *         type: object
 *         properties:
 *           message:
 *             type: object
 *             properties:
 *               FamilyLocalID:
 *                 type: String
 *                 description: ID generated for the family analysis
 *                 example: WES-hg19-VCF-2
 *               details:
 *                 type: object
 *                 description: Family Analysis Options
 *                 properties:
 *                   SeqTypeName:
 *                     type: string
 *                     example: WES
 *                   AssemblyType:
 *                     type: string
 *                     example: hg19
 *                   FileType:
 *                     type: string
 *                     example: VCF
 *       fam_precomp_stat:
 *         type: object
 *         properties:
 *           family_local_id:
 *             type: String
 *             description: Local ID for the analysis in the format SequenceType-Assembly-fileType-UniqueID
 *             example: "WES-hg19-VCF-2"
 *           status:
 *             type: String
 *             description: Pre-compute status of the Family Analysis
 *             example: completed 
 */
