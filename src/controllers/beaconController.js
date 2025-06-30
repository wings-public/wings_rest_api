// Dependencies
const axios = require("axios");


// Function definitions
// Function 1: Validate if the query is in the correct format
function validateFrequencyVariant(chr, pos, alt_allele, ref_allele) {
  try {
    if (chr < 23 || chr == "X" || chr == "Y" || chr == "MT") {
      if (/^[0-9]+$/.test(pos)) {
        if (/^[A*T*G*C*]+$/.test(alt_allele)) {
          if (/^[A*T*G*C*]+$/.test(ref_allele)) {
            return true;
          }
        }
      }
    }
  } catch (err) {
    next(err);
  }
}

////////////////////////////////////
// Fetching the results of Beacon //
////////////////////////////////////

// Function 1 for validating the query: same as for WiNGS so defined above

// Function 2: Call the API
async function apiBeacon(paramsObj, beacons) {
  //Check if 1 or > beacons are provided in the query
  if (beacons) {
    // Check how many beacons are provided to query for variants
    var beacons = beacons.split(",");
    //console.log("Which beacon(s) are provided?", beacons);
    //console.log("How many beacon(s) are provided?", beacons.length)

    // in case multiple beacons are provided to query
    if (beacons.length > 1) {
      paramsObj["beacon"] = beacons.join();
      //console.log(paramsObj);
      //console.log("multiple beacons are provided");
      try {
        const response = await axios.get(
          "https://beacon-network.org/api/responses",
          {
            params: paramsObj,
          }
        );
        //console.log(response.data);
        return response.data;
      } catch (error) {
        console.log(error);
      }
    }

    // in case only 1 beacon is provided to query for variants
    else if (beacons.length == 1) {
      //console.log(beacons);
      //console.log("1 beacon is provided");
      try {
        const response = await axios.get(
          `https://beacon-network.org/api/responses/${beacons}`,
          {
            params: paramsObj,
          }
        );
        //console.log(response.data);
        return response.data;
      } catch (error) {
        console.log(error);
      }
    }
  }

  // if no beacons are defined in the query, you should ask to define one (or more)
  else {
    console.log("Please provide 1 or more beacon(s) to query");
    return;
  }
}

// Beacon API: use the 2 functions above to use the API if the query is valid
const BeaconVariant = async (req, res, next) => {
  // Use the parameters send in the URL
  paramsObj = {};
  paramsObj["chrom"] = parseInt(req.query.chrom);
  paramsObj["pos"] = parseInt(req.query.pos);
  paramsObj["allele"] = req.query.allele;
  paramsObj["referenceAllele"] = req.query.referenceAllele;
  if (req.query.ref) {
    paramsObj["ref"] = req.query.ref;
  }
  beacons = req.query.beacon;

  // Use the above defined functions
  try {
    // Validate the query  (function 1)
    console.log("Are the 4 mandatory parameters valid?");
    var resp = await validateFrequencyVariant(
      paramsObj.chrom,
      paramsObj.pos,
      paramsObj.allele,
      paramsObj.referenceAllele
    );
    console.log(resp);
    if (resp == true) {
      // If the query is correct, you can use the API (function 2)
      out = await apiBeacon(paramsObj, beacons);
      //console.log(out);
      res.send(out);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { BeaconVariant };