/**
 * @swagger
 * paths:
 *    /piid:
 *     get:
 *       summary: Get the piid for which the user has access
 *       security:
 *         - jwt: []
 *       tags: [Meta]
 *       description: Get the PIID for which the user has direct and assigned access
 *               
 *       responses: 
 *         "200":
 *           description : "A list of PIID"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/piid_resp'
 *         "401":
 *           description: "Unauthorized" 
 *    /hostid:
 *     get:
 *       summary: Get the hostid for which the user has access
 *       security:
 *         - jwt: []
 *       tags: [Meta]
 *       description: Get the hostid based on the center for which the user has access
 *               
 *       responses: 
 *         "200":
 *           description : "Hostid details"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/hostid_resp'
 *         "401":
 *           description: "Unauthorized" 
 *    /samplesheet/status?:
 *     get:
 *       summary: Get the status of the sample sheet import based on a specific date
 *       security:
 *         - jwt: []
 *       tags: [Meta]
 *       description: Provides the status of import for each of the sample added to the sample sheet
 *       parameters:
 *         - in: query
 *           name: date
 *           type: string
 *           example: 2023-05-22
 *           description: Date format yyyy-mm-dd
 *         - in: query
 *           name: hostid
 *           type: integer
 *           example: 1
 *           description: Host ID
 *       responses: 
 *         "200":
 *           description : "Sample Import details"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: object
 *                     example:
 *                       "counts": {"Import Request Completed": 6}
 *                       "details" : [ {"loadedTime": "2023-05-22T09:19:10.035Z","SampleLocalID": "tudna247182i","fileID": "23052230007","Status": "Import Request Completed"}  ]
 *         "401":
 *           description : "Unauthorized"
 *    /individuals:
 *     get:
 *       summary: Get all the Individuals defined in user's center
 *       security:
 *         - jwt: []
 *       tags: [Individuals-Data Collection]
 *       description: All the Individuals/Patients defined in WiNGS center of the user can be retrieved
 *               
 *       responses: 
 *         "200":
 *           description : "A list of Individuals"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/individual'
 *         "401":
 *           description: "Unauthorized" 
 *     put:
 *       summary: Edit Individual meta data
 *       security:
 *         - jwt: []
 *       tags: [Individuals-Data Collection]
 *       description: Edit meta data of the Individual.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ind_edit'           
 *       responses: 
 *         "200":
 *           description : "success"
 *         "401":
 *           description : "Unauthorized"
 *    /individuals?:
 *     get:
 *       summary: WiNGS Filter Individuals based on PIID 
 *       security:
 *         - jwt: []
 *       tags: [Individuals-Data Collection]
 *       description: Apply PIID filter and retrieve  the Individuals/Patients defined in WiNGS center of the user can be retrieved
 *       parameters:
 *         - in: query
 *           name: piid
 *           type: integer
 *           default: 27
 *           description: piid for which the user has access can be supplied here   
 *       responses: 
 *         "200":
 *           description : "A list of Individuals"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/individual'     
 *         "401":
 *           description : "Unauthorized"
 *    /individuals/{indId}:
 *     get:
 *       summary: Get Individual based on ID
 *       parameters:
 *         - in : path
 *           name: indId
 *           default: 21060900006
 *           description: Numeric ID of the Individual in WiNGS
 *           schema:
 *             type: integer
 *       security:
 *         - jwt: []
 *       tags: [Individuals-Data Collection]
 *       description: Retrieve  the Individual defined in WiNGS center of the user can be retrieved
 *       responses: 
 *         "200":
 *           description : "A single Individual"
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/individual'     
 *         "401":
 *           description : "Unauthorized"
 *    /individuals/phenotype:
 *     post:
 *       summary: Add HPO term(phenotype) to Individual
 *       security:
 *         - jwt: []
 *       tags: [Individuals-Data Collection]
 *       description: HPO Term can be added to the Individual defined in WiNGS
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/ind_phen'
 *               
 *       responses: 
 *         "200":
 *           description : "Success"
 *         "401":
 *           description: "Unauthorized" 
 *     delete:
 *       summary: Delete HPO term(phenotype) from Individual
 *       security:
 *         - jwt: []
 *       tags: [Individuals-Data Collection]
 *       description: HPO Term to be deleted from the Individual defined in WiNGS
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/ind_phen'
 *               
 *       responses: 
 *         "200":
 *           description : "Success"
 *         "401":
 *           description: "Unauthorized" 
 *    /families:
 *     post:
 *       summary: Create a new family.Returns the created family ID.
 *       security:
 *         - jwt: []
 *       tags: [Families-Data Collection]
 *       description: Family ID is returned
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/family_desc' 
 *                 - $ref: '#/components/schemas/host' 
 *                 - $ref: '#/components/schemas/piid'  
 *       responses: 
 *         "200":
 *           description : "Object with the Family ID "
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: object
 *                     properties:
 *                       family_id:
 *                         type: integer
 *                         description: WiNGS generated family id
 *                         example: 260600024001
 *         "401":
 *           description: "Unauthorized" 
 *     get:
 *       summary: Get all the families defined in user's center
 *       security:
 *         - jwt: []
 *       tags: [Families-Data Collection]
 *       description: All the Families defined in WiNGS center of the user can be retrieved     
 *       responses: 
 *         "200":
 *           description : "A list of families"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/family'
 *         "401":
 *           description: "Unauthorized" 
 *    /families?:
 *     get:
 *       summary: WiNGS Filter Families based on PIID or Proband ID
 *       security:
 *         - jwt: []
 *       tags: [Families-Data Collection]
 *       description: Apply PIID filter or Proband ID filter and retrieve  the Families defined in WiNGS center of the user can be retrieved
 *       parameters:
 *         - in: query
 *           name: piid
 *           type: integer
 *           default: 27
 *           description: piid for which the user has access can be supplied here. To filter based on piid, use query parameter piid. Example - `piid=27`  
 *         - in: query
 *           name: proband
 *           type: string
 *           default: 22101200001
 *           description: Families for which the supplied parameter is the proband(index). To filter based on proband, use query parameter proband. Example - `proband=22101200001` 
 *       responses: 
 *         "200":
 *           description : "A list of Families"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/family'     
 *         "401":
 *           description : "Unauthorized"
 *    /families/id/{famId}:
 *     get:
 *       summary: Get Family based on Family ID
 *       parameters:
 *         - in : path
 *           name: famId
 *           default: 21030210001
 *           description: Numeric ID of the family in WiNGS
 *           schema:
 *             type: integer
 *       security:
 *         - jwt: []
 *       tags: [Families-Data Collection]
 *       description: Retrieve  the Family defined in WiNGS center of the user can be retrieved
 *       responses: 
 *         "200":
 *           description : "A single Family"
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/family'     
 *         "401":
 *           description : "Unauthorized"
  *    /families/membertype:
 *     get:
 *       summary: Get all the member types who can be added to family
 *       security:
 *         - jwt: []
 *       tags: [Family Members-Data Collection]
 *       description: Member Names listed here can be used to get the unassiged member and then assign them to family
 *       responses: 
 *         "200":
 *           description : "All member types"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/mem_type'
 *         "401":
 *           description : "Unauthorized"
 *    /families/unassigned:
 *     get:
 *       summary: WiNGS Get unassigned members based on member type
 *       security:
 *         - jwt: []
 *       tags: [Family Members-Data Collection]
 *       description: Get unassigned members based on the member type and assign them using /families/assign endpoint
 *       parameters:
 *         - in: query
 *           name: type
 *           type: string
 *           default: Proband
 *           description: Member type to fetch the unassigned members.type=Proband or Father or Mother
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
 *           description : "A list of unassigned Individuals"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/individual'     
 *         "401":
 *           description : "Unauthorized"
 *    /families/assign:
 *     post:
 *       summary: WiNGS - Assign Member to family
 *       security:
 *         - jwt: []
 *       tags: [Family Members-Data Collection]
 *       description: Assign the provided individual to family
 *       parameters:
 *         - in: query
 *           name: type
 *           type: string
 *           default: Proband
 *           description: type=Proband or Father or Mother
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               allOf:      
 *                 - $ref: '#/components/schemas/host'     
 *                 - $ref: '#/components/schemas/famid'           
 *                 - $ref: '#/components/schemas/indid'           
 *       responses: 
 *         "200":
 *           description : "Result"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/individual'     
 *         "401":
 *           description : "Unauthorized"
 *    /families/unassign:
 *     post:
 *       summary: WiNGS - Unassign Member from the family
 *       security:
 *         - jwt: []
 *       tags: [Family Members-Data Collection]
 *       description: Unassign the provided individual from the family
 *       parameters:
 *         - in: query
 *           name: type
 *           type: string
 *           example: Father
 *           description: type=Father or Mother
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               allOf:      
 *                 - $ref: '#/components/schemas/host'     
 *                 - $ref: '#/components/schemas/famid'           
 *                 - $ref: '#/components/schemas/indid'           
 *       responses: 
 *         "200":
 *           description : "Result"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/individual'     
 *         "401":
 *           description : "Unauthorized"
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
 *       family_desc:
 *         type: object
 *         required:
 *           - family_desc
 *         properties:
 *           family_desc:
 *             type: string
 *             description: brief description for the family
 *             example: family for analysing trio index dna4567
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
 *       piid_resp:
 *         type: object
 *         properties:
 *           CenterID:
 *             type: Integer
 *             description: CenterID for which the user has access
 *             example: 3
 *           PIID:
 *             type: Integer
 *             description: PIID corresponding to the specific center.
 *             example: 27 
 *           PIName:
 *             type: string
 *             description: PI Name corresponding to the PIID
 *             example: Test PI Name 
 *       hostid_resp:
 *         type: object
 *         properties:
 *           HostID:
 *             type: Integer
 *             description: ID of respective host
 *             example: 1
 *           IPCenter:
 *             type: String
 *             description: URL of the Client API
 *             example: https://wings-ua-dev.biomina.be/ua/dev/local/ 
 *       individual:
 *         type: object
 *         properties:
 *           IndividualID:
 *             type: Integer
 *             description: ID of Individual created in WiNGS
 *             example: 21062500001
 *           IndividualFName:
 *             type: String
 *             description: First Name of Individual
 *             example: Las 
 *           IndividualLName:
 *             type: String
 *             description: Last Name of Individual
 *             example: JohnLastVos
 *           IndividualStatus:
 *             type: Integer
 *             description: Alive/Dead status of the Individual.0=Dead,1=Alive,null=Not specified
 *             example: 0
 *           IndividualSex:
 *             type: Integer
 *             description: Gender of Individual created in WiNGS.0=Female,1=Male,null=Not Specified
 *             example: 0
 *           UserID:
 *             type: Integer
 *             description: User ID of WiNGS user who performed the last update
 *             example: 23
 *           LocalID:
 *             type: String
 *             description: free text included to identify the Individual
 *             example: SanDiego-dna372378
 *           PIID:
 *             type: Integer
 *             description: PI ID of the center in which this Individual was defined
 *             example: 1105
 *           DateAdd:
 *             type: Date
 *             description: Date when the Individual was created in WiNGS
 *             example: 2022/05/03
 *           Relevant_Clinical_Info:
 *             type: String
 *             description: Related clinical details for the Individual
 *             example: seizure history
 *           IndividualBirthDate:
 *             type: Date
 *             description: Birthdate of the Individual
 *             example: 2002/12/04
 *           Age:
 *             type: Integer
 *             description: Calculated age based on the birth date
 *             example: 20
 *           phenotype:
 *             type: Integer
 *             description: Associated phenotype(HPO) for the Individual
 *             example: []  
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
 */
