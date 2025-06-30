/**
 * @swagger
 * paths:
 *   /SV_samples/trio_discovery:
 *     post:
 *       summary: Post the SV samples discovery data
 *       security:
 *         - jwt: []
 *       tags: [SV Trio-Data Analysis]
 *       description: Submit discovery data for SV samples.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *                 allOf:
 *                   
 *                   - $ref: '#/components/schemas/SV_trio_filter'
 *       responses: 
 *         "200":
 *           description : "Object with the request ID of the SV Trio discovery request"
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
 *                         description: Request ID of the SV Trio discovery request
 *                         example: 39279
 *   /SV_samples/trio_discovery/results?:
 *     post:
 *       summary: Retrieve results for the Trio discovery request based on the request id.
 *       security:
 *         - jwt: []
 *       tags: [SV Trio-Data Analysis]
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
 *                             example: http://localhost:5000/SV_samples/trio_discovery/results?page=2
 *                           next_page:
 *                             type: string
 *                             example: http://localhost:5000/SV_samples/trio_discovery/results?page=3
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
 *       SV_trio_filter:
 *         type: object
 *         required:
 *          - host_id
 *          - piid
 *          - TrioLocalID
 *          - trio_filter_vector
 *         properties:
 *           TrioLocalID:
 *             type: String
 *             example: "WGS-GRCh38-SV_VCF-12345"
 *           trio_filter_vector:
 *             type: String
 *             example: "100"  
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