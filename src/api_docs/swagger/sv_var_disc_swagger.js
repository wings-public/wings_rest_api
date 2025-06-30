/**
 * @swagger
 * paths:
 *   /SVvariant/discovery/query:
 *     post:
 *       summary: Post the SV to search 
 *       security:
 *         - jwt: []
 *       tags: [SV Discovery-(Multi-Center) Data Analysis]
 *       description: Submit discovery data for SV samples.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *                 allOf:
 *                   - $ref: '#/components/schemas/SV_sample_disc'
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
 *   /SVvariant/discovery/query/results:
 *     post:
 *       summary: Get the results of variant discovery request
 *       security:
 *         - jwt: []
 *       tags: [SV Discovery-(Multi-Center) Data Analysis]
 *       description: Variant Discovery results
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 request_id:
 *                   type: integer
 *                   example: 20
 *       responses: 
 *         "200":
 *           description : | 
 *             - overall will be {"var+phen": 0,"var-phen": 0, "-var+phen": 0,"-var-phen": 0} is  'inprogress'
 *             - overall will have the cumulated counts for the variants and hpo terms 
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: object
 *                     example:
 *                       "overall": {"var+phen": 0,"var-phen": 20,"-var+phen": 0,"-var-phen": 64 }
 *                       "status": "completed"
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
 *       SV_sample_disc:
 *         type: object
 *         required:
 *          - sv_type
 *          - start_chr
 *          - start_pos
 *          - host_id
 *          - sv_len
 *         properties:
 *           host_id:
 *             type: Integer
 *             example: 1
 *           ref_build_type:
 *             type: String
 *             example: "hg38"
 *           seq_type:
 *             type: String
 *             example: "WGS"
 *           sv_type:
 *             type: String
 *             example: "DEL"
 *           start_chr:
 *             type: String
 *             example: "1"
 *           end_chr:
 *             type: String
 *             example: "1"
 *           start_pos:
 *             type: Integer
 *             example: 1000
 *           sv_len:
 *             type: Integer
 *             example: 100
 *           filter:
 *             type: String
 *             example: "PASS"
 *           gt:
 *             type: String
 *             example: "0/1"
 *           ACMG_class:
 *             type: Integer
 *             description: "Returns everything greater than the number inserted"
 *             example: 3
 *           hpo_list:
 *             type: array
 *             description: "list of hpos"
 *             items: 
 *               type: String
 *             example: ["HP:0000924","HP:0040064","HP:0011842"]
 */