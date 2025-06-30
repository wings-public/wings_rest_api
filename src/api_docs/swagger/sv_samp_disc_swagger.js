/**
 * @swagger
 * paths:
 *   /SV_samples:
 *     get:
 *       summary: Get the defined samples and files for the specific PIID and hostID 
 *       security:
 *         - jwt: []
 *       tags: [SV Samples-Data Analysis]
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
 *           description: A list of samples and files with details on the reference build
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/samp_dis_SV'     
 *         "401":
 *           description: Unauthorized
 *   /SV_samples/discovery:
 *     post:
 *       summary: Post the SV samples discovery data
 *       security:
 *         - jwt: []
 *       tags: [SV Samples-Data Analysis]
 *       description: Submit discovery data for SV samples.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *                 allOf:
 *                   - $ref: '#/components/schemas/host'           
 *                   - $ref: '#/components/schemas/piid'
 *                   - $ref: '#/components/schemas/SV_sample_filter'
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
 *   /SV_samples/discovery/results?:
 *     post:
 *       summary: Retrieve results for the sample discovery request based on the request id.
 *       security:
 *         - jwt: []
 *       tags: [SV Samples-Data Analysis]
 *       description: Fetch Results(variants). Additional details are included in the Responses section below.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 request_id:
 *                   type: integer
 *                   example: 2547
 *                 local_id:
 *                   type: string
 *                   example: dnaEH6m
 *       parameters:
 *         - in: query
 *           name: page
 *           type: integer
 *           default: 1
 *           description: Page number of the results.  
 *       responses: 
 *         "200":
 *           description : |
 *             - Results are paginated to handle the response efficiently. 10 variants are displayed in each page
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
 *                             example: http://localhost:5000/SV_samples/discovery/results?page=2
 *                           next_page:
 *                             type: string
 *                             example: http://localhost:5000/SV_samples/discovery/results?page=3
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
 *       samp_dis_SV:
 *         type: object
 *         properties:
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
 *             example: hg19 (GRCh38)
 *       SV_sample_filter:
 *         type: object
 *         required:
 *          - host_id
 *          - piid
 *          - individualID
 *          - fileID
 *         properties:
 *           host_id:
 *             type: Integer
 *             example: 1
 *           piid:
 *             type: Integer
 *             example: 27
 *           individualID:
 *             type: Integer
 *             example: 24052100001
 *           fileID:
 *             type: Integer
 *             example: 12345
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