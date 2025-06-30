/**
 * @swagger
 * paths:
 *    /variant/frequency:
 *     post:
 *       summary: Send request to get the frequency of a variant within the WiNGS ecosystem
 *       security:
 *         - jwt: []
 *       tags: [Variant Frequency-(Multi-Center) Data Analysis]
 *       description: Variant frequency request
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/variant'  
 *                 - $ref: '#/components/schemas/ref_build_type'  
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
 *                         example: 20
 *         "401":
 *           description: "Unauthorized" 
 *    /variant/frequency/results:
 *     get:
 *       summary: Get the results of variant frequency request
 *       security:
 *         - jwt: []
 *       tags: [Variant Frequency-(Multi-Center) Data Analysis]
 *       description: Variant frequency results
 *       parameters:
 *         - in: query
 *           name: request_id
 *           type: integer
 *           required: true
 *           example: 20
 *           description: Request id  
 *       responses: 
 *         "200":
 *           description : |
 *             - overall will be [] when the status is  'inprogress'
 *             - overall will be array of objects when status is 'completed'
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: object
 *                     example:
 *                       "overall": [{"exp" : "WES", "ref_build":"hg19","cnt":8, "sample-size":39},{"exp": "WGS", "ref_build": "hg19", "cnt": 1, "sample-size":1},{"exp": "PANEL", "ref_build": "hg19", "cnt": 2, "sample-size":3},{"exp":"WGS", "ref_build": "hg38", "cnt": 0,"sample-size":43},{"exp":"WES", "ref_build": "hg19", "cnt": 0,"sample-size":1},{"exp": "PANEL", "ref_build": "hg19", "cnt": 2,"sample-size":3}]                   
 *                       "status": "completed"
 *         "401":
 *           description: "Unauthorized" 
 *    /hpo/translate:
 *     post:
 *       summary: Get the HPO Name corresponding to the HPO ID
 *       security:
 *         - jwt: []
 *       tags: [Variant Discovery and Statistics-(Multi-Center) Data Analysis]
 *       description: HPO Tree
 *       parameters:
 *         - in: query
 *           name: type
 *           type: string
 *           example: HP:0000529,HP:0000540
 *           description: comma separated hpo_id
 *       responses: 
 *         "200":
 *           description : "HPO Name"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: object
 *                     example:
 *                       "HP:0000529" : "Progressive visual loss"
 *                       "HP:0000540" : "HYpermetropia"
 *                     additionalProperties: true
 *         "401":
 *           description : "Unauthorized"
 *    /hpo/tree:
 *     post:
 *       summary: Get the parent and child hpo nodes for the specific hpo node of interest
 *       security:
 *         - jwt: []
 *       tags: [Variant Discovery and Statistics-(Multi-Center) Data Analysis]
 *       description: HPO Tree
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hpo_id:
 *                   type: String
 *                   example: HP:0002813
 *       responses: 
 *         "200":
 *           description : "Parent and child levels for the HPO term of interest"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: object
 *                     example:
 *                       "parent" : {"max-level" :2, levels : { "1" : ["HP:0011844"], "2" : ["HP:0011842"]} }
 *                       "child" : {"max-level" :2, levels : { "1" : ["HP:0000940","HP:0000944","HP:0003106","HP:0006505","HP:0030030","HP:0410049"], "2" : ["HP:0000940","HP:0000944","HP:0003106","HP:0006505","HP:0030030","HP:0410049"]} }
 *                     additionalProperties: true
 *         "401":
 *           description : "Unauthorized"
 *    /hpo/tree/filter:
 *     post:
 *       summary: Get the list of hpo terms based on the number of parent and child levels to traverse in the tree.
 *       security:
 *         - jwt: []
 *       tags: [Variant Discovery and Statistics-(Multi-Center) Data Analysis]
 *       description: HPO Tree
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hpo_id:
 *                   type: String
 *                   example: HP:0002813
 *                 parent_levels:
 *                   type: String
 *                   example: 2
 *                 child_levels:
 *                   type: String
 *                   example: 2
 *       responses: 
 *         "200":
 *           description : "Object with list of HPO terms"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: object
 *                     example:
 *                       "hpo_list" : ["HP:0011844","HP:0040068","HP:0011842","HP:0040064","HP:0000940","HP:0000944","HP:0003106","HP:0006505"]
 *                     additionalProperties: true
 *         "401":
 *           description : "Unauthorized"
 *    /variant/discovery/filter:
 *     get:
 *       summary: Fetch the filters(ID) which are available for this User, specific to Variant Discovery
 *       security:
 *         - jwt: []
 *       tags: [Variant Discovery and Statistics-(Multi-Center) Data Analysis]
 *       description: Filters can be created only using WiNGS UI. This API is used to fetch the defined filters.
 *       responses: 
 *         "200":
 *           description : "Object with the available filters"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/trio_filter'     
 *         "401":
 *           description : "Unauthorized"
 *    /variant/discovery/filter/leaf:
 *     post:
 *       summary: Fetch the leaf ID with the corresponding condition for the specific filter tree ID 
 *       security:
 *         - jwt: []
 *       tags: [Variant Discovery and Statistics-(Multi-Center) Data Analysis]
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
 *    /variant/discovery/query:
 *     post:
 *       summary: Send  variant discovery request for the specific filter and the hpo terms.
 *       security:
 *         - jwt: []
 *       tags: [Variant Discovery and Statistics-(Multi-Center) Data Analysis]
 *       description: >
 *         Request can be launched based on a specific query_type (gene or region) and filters. 
 *         - Example1 - "query_type" : {"region" : "2-110216-1702860"} 
 *         - Example2 -  "query_type" : {"geneID" : ["8315"]}
 *         - To correlate the resulting variants with the phenotype,hpo terms can be provided in hpo_list
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/filter_id' 
 *                 - $ref: '#/components/schemas/host' 
 *                 - $ref: '#/components/schemas/ref_build_type'
 *                 - $ref: '#/components/schemas/filter_level' 
 *                 - $ref: '#/components/schemas/query' 
 *                 - $ref: '#/components/schemas/seq_type'  
 *                 - $ref: '#/components/schemas/hpo_list'  
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
 *                         example: 20
 *         "401":
 *           description: "Unauthorized" 
 *    /variant/discovery/query/results:
 *     get:
 *       summary: Get the results of variant discovery request
 *       security:
 *         - jwt: []
 *       tags: [Variant Discovery and Statistics-(Multi-Center) Data Analysis]
 *       description: Variant Discovery results
 *       parameters:
 *         - in: query
 *           name: request_id
 *           type: integer
 *           required: true
 *           example: 20
 *           description: Request id  
 *       responses: 
 *         "200":
 *           description : |
 *             - status will be inprogress or expired or completed
 *             - annotations will have the annotations of every variant if status is completed
 *             - annotations will be {} if status is not completed
 *             - variant-counts contains the variant and hpo terms presence/absence combination counts
 *             - variant-counts will be {} if status is not completed   
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
 *                       "annotations": {"1-138593-G-T": {"gene_annotations": [],"phred_score": 1.959,"RNACentral": []},"1-139233-C-A": {"gene_annotations": [{"transcript_id": "NR_039983.2","impact": "MODIFIER","consequence_terms": ["non_coding_transcript_exon_variant"],"codons": null,"gene_id": "729737","csn": null}],"phred_score": 1.959,"RNACentral": []}}
 *                       "variant-counts" : {"1-138593-G-T": {"var+phen": 0,"var-phen": 4,"-var+phen": 0,"-var-phen": 37},"1-139233-C-A": {"var+phen": 0,"var-phen": 16,"-var+phen": 0,"-var-phen": 27}}
 *                       "overall": {"var+phen": 0,"var-phen": 20,"-var+phen": 0,"-var-phen": 64 }
 *                       "status": "completed"
 *         "401":
 *           description: "Unauthorized" 
 *    /variant/discovery/statistics:
 *     post:
 *       summary: Perform a statistical test for the overall variant and hpo frequency
 *       security:
 *         - jwt: []
 *       tags: [Variant Discovery and Statistics-(Multi-Center) Data Analysis]
 *       description: Precomputation request
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/overall' 
 *                 - $ref: '#/components/schemas/stats_test'  
 *       responses: 
 *         "200":
 *           description : "Object with p-value which indicates the result of hypothesis "
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: object
 *                     properties:
 *                       p-value:
 *                         type: float
 *                         description: p-value 
 *                         example: 0.2247765
 *         "401":
 *           description: "Unauthorized" 
 *    /variant/discovery/collaborate:
 *     post:
 *       summary: Request for collaboration with other centers based on result from /variant/discovery/query/results. 
 *       security:
 *         - jwt: []
 *       tags: [Variant Discovery and Statistics-(Multi-Center) Data Analysis]
 *       description: This request can be executed only for the variant which had an associated phenotype. Example - Only if V+P is greater than 0. Note - Contact details of the requestor will be shared with the collaborating centers to indicate your interest in collaboration, specific to this variant.Status can be tracked by executing /variant/discovery/collaborate/status
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 request_id:
 *                   type: integer
 *                   description : Request id generated for /variant/discovery/query request
 *                   example: 20
 *                 variant:
 *                   type: string
 *                   example: 1-14115-A-T
 *       responses: 
 *         "200":
 *           description : |
 *             - status will be requested 
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: object
 *                     example:
 *                       "status": "requested"
 *         "401":
 *           description: "Unauthorized" 
 *    /variant/discovery/collaborate/status:
 *     get:
 *       summary: Track the status of variant discovery collaboration request 
 *       security:
 *         - jwt: []
 *       tags: [Variant Discovery and Statistics-(Multi-Center) Data Analysis]
 *       description: If the request is accepted, the contact details are provided. Rejected center counts are indicated
 *       parameters:
 *         - in: query
 *           name: request_id
 *           type: integer
 *           required: true
 *           example: 20
 *           description: Request id  generated for /variant/discovery/query API
 *       responses: 
 *         "200":
 *           description : |
 *             - Details on the variant collaboration
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: object
 *                     example:
 *                       "rejected": 1
 *                       "approved" : [ { "pi_mail" : pi-mail@org.be } ]
 *         "401":
 *           description: "Unauthorized" 
 *    /variant/frequency/beacon:
 *     get:
 *       summary: Fetch the frequency of a variant within the public beacons. Execute GET https://beacon-network.org/api/beacons for the list of beacons
 *       tags: [Beacon-External]
 *       description: Query Beacon(s) 
 *       parameters: 
 *         - in: query
 *           name: chrom
 *           type: integer
 *           default: 17
 *           description: Provide the chromosome
 *           required: true
 *         - in: query
 *           name: pos
 *           type: integer
 *           default: 41244981
 *           description: Provide the position
 *           required: true
 *         - in: query
 *           name: allele
 *           type: string
 *           default: G
 *           description: Provide the alternate allele
 *           required: true
 *         - in: query
 *           name: referenceAllele
 *           type: string
 *           default: A
 *           description: Provide the reference allele
 *           required: true
 *         - in: query
 *           name: ref
 *           type: string
 *           default: GRCh37
 *           description: Provide the reference genome
 *         - in: query
 *           name: beacon
 *           type: string
 *           default: amplab
 *           description: Provide the beacon(s)
 *       responses:
 *         "200":
 *          description: "Successful response" 
 *          content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: object
 *                     example: { "beacon": { "id": "amplab","name": "AMPLab - 1000 Genomes Project","url": null,"organization": "AMPLab, UC Berkeley","description": null,"homePage": null,"email": null,"aggregator": false,"enabled": false,"visible": false,"createdDate": 1395273600000,"supportedReferences": ["HG18","HG19","HG38"],"aggregatedBeacons": null},
 *                              "query": {"chromosome": "CHR17","position": 41244981,"referenceAllele": null,"allele": "G","reference": "HG19"},
 *                              "response": true, "frequency": null,"externalUrl": null, "info": null,
 *                              "authHint": {"accessType": "public","authRequirements": []},"fullBeaconResponse": null}
 *         "401":
 *          description: "Unauthorized" 
 *         "404":
 *          description: "Not found" 
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
 *       variant:
 *         type: object
 *         required:
 *           - variant
 *         properties:
 *           variant:
 *             type: String
 *             description: Variant in the format chr-position-ref_allele-alt_allele
 *             example: 1-16977-G-A
 *       ref_build_type:
 *         type: object
 *         required:
 *           - ref_build_type
 *         properties:
 *           ref_build_type:
 *             type: String
 *             description: Genome assembly or reference build type
 *             example: hg19 
 *       user:
 *         type: object
 *         required:
 *           - user_id
 *         properties:
 *           user_id:
 *             type: integer
 *             description: WiNGS User ID
 *             example: 1085
 *       filter_id:
 *         type: object
 *         required:
 *           - filter_id
 *         properties:
 *           filter_id:
 *             type: integer
 *             description: Filter ID defined in WiNGS UI. Can be selected based on /variant/discovery/filter API
 *             example: 5296
 *       filter_level:
 *         type: object
 *         required:
 *           - filter_level
 *         properties:
 *           filter_level:
 *             type: String
 *             description: Leaf of the defined filter Tree. Can be selected based on  /variant/discovery/filter/leaf API
 *             example: "1,2"
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
 *       trio_filter:
 *         type: object
 *         properties:
 *           FilterID:
 *             type: Integer
 *             description: Filter ID of the Variant Discovery Filter Tree defined in WiNGS UI
 *             example: 5300
 *           FilterName:
 *             type: String
 *             description: Filter Name of the Variant Discovery Filter Tree defined in WiNGS UI
 *             example: var_api_filter1 
 *           Description:
 *             type: String
 *             description: Description of the Variant Discovery Filter Tree defined in WiNGS UI
 *             example: "Variant Discovery filter defined in WiNGS UI" 
 *           CreatedDate:
 *             type: String
 *             description: Filter creation timestamp
 *             example: 2022-10-18T00:00:00.000Z
 *           BasedOnIndividual:
 *             type: String
 *             description: Not Applicable
 *             example: null
 *       query:
 *         type: object
 *         required:
 *           - query
 *         properties:
 *           query_type:
 *             type: Object
 *             description: Filter ID of the Variant Discovery Filter Tree defined in WiNGS UI
 *             example: {"geneID" : ["729737"]}
 *       overall:
 *         type: object
 *         required:
 *           - overall
 *         properties:
 *           overall:
 *             type: Object
 *             description: overall object which has the variant counts based on the API /variant/discovery/query/results
 *             example: {"var+phen" : 0, "var-phen" : 937, "-var+phen" : 10, "-var-phen" : 4082}
 *       stats_test:
 *         type: object
 *         required:
 *           - stats_test
 *         properties:
 *           stats_test:
 *             type: String
 *             description: Type of statistical test. Currently, only fisher test is supported
 *             example: fisher test 
 *       seq_type:
 *         type: object
 *         required:
 *           - seq_type
 *         properties:
 *           seq_type:
 *             type: String
 *             description: Type of sequencing. WES or WGS or PANEL
 *             example: WES 
 *       hpo_list:
 *         type: object
 *         required:
 *           - hpo_list
 *         properties:
 *           hpo_list:
 *             type: array
 *             items:
 *               type: String
 *             example: ["HP:0000924","HP:0040064","HP:0011842"]
 */
