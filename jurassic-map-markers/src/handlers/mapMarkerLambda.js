// Import AWS SDK
const AWS = require('aws-sdk');
// Create DynamoDB client
const dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
// Import Turf GeoSpatial libraries
const turf = require('@turf/turf');
// Import Turf helpers libraries for point and polygon
const helpers = require('@turf/helpers');
// Create Turf helpers function
turf.helpers = helpers;

var newItem;
var paddock;

// Function for looking up and setting the current mapMarker's paddock coordinates
function paddockLookup(input) {
    console.log("Current Paddock: ", input);
    switch (input) {
        case 'herbLoc01':
            paddock = helpers.polygon([
                [
                    [1222, 711],
                    [1454, 653],
                    [1396, 467],
                    [1272, 554],
                    [1203, 594],
                    [1077, 694],
                    [1043, 696],
                    [1222, 711]
                ]
            ]);
            break;
        case 'gailliLoc01':
            paddock = helpers.polygon([
                [
                    [1155, 1002],
                    [1270, 961],
                    [1272, 737],
                    [1409, 701],
                    [1443, 664],
                    [1221, 722],
                    [1100, 709],
                    [1031, 831],
                    [1027, 870],
                    [1155, 1002]
                ]
            ]);
            break;
        case 'baryonyxLoc01':
            paddock = helpers.polygon([
                [
                    [1870, 1252],
                    [1888, 1207],
                    [2050, 1038],
                    [2023, 937],
                    [2025, 866],
                    [1797, 1011],
                    [1735, 1072],
                    [1684, 1102],
                    [1655, 1711],
                    [1655, 1199],
                    [1870, 1252]
                ]
            ]);
            break;
        case 'trikeLoc01':
            paddock = helpers.polygon([
                [
                    [1462, 653],
                    [1507, 640],
                    [1545, 567],
                    [1589, 535],
                    [1753, 563],
                    [1738, 487],
                    [1594, 368],
                    [1545, 390],
                    [1456, 445],
                    [1408, 479],
                    [1462, 653]
                ]
            ]);
            break;
        case 'diloLoc01':
            paddock = helpers.polygon([
                [
                    [1087, 1027],
                    [1144, 1005],
                    [1113, 978],
                    [1045, 984]
                    [971, 840],
                    [963, 837],
                    [1015, 902],
                    [1059, 959],
                    [1075, 988],
                    [1087, 1027]
                ]
            ]);
            break;
        case 'trexLoc01':
            paddock = helpers.polygon([
                [
                    [1618, 952],
                    [1694, 817],
                    [2026, 858],
                    [2009, 852],
                    [1877, 778],
                    [1811, 688],
                    [1818, 584],
                    [1592, 542],
                    [1552, 568],
                    [1552, 587],
                    [1512, 647],
                    [1460, 658],
                    [1334, 781],
                    [1349, 900],
                    [1618, 952]
                ]
            ]);
            break;
        case 'metricanthLoc01':
            paddock = helpers.polygon([
                [
                    [1820, 576],
                    [1832, 519],
                    [1808, 405],
                    [1690, 396],
                    [1615, 335],
                    [1704, 436],
                    [1754, 496],
                    [1763, 565],
                    [1820, 576]
                ]
            ]);
            break;
        case 'proceratLoc01':
            paddock = helpers.polygon([
                [
                    [1219, 1215],
                    [1246, 1175],
                    [1087, 1035],
                    [1097, 1109],
                    [1219, 1215]
                ]
            ]);
            break;
    }
}

// Function for randomly incrementing the input number, returns result as a string
function random(input) {
    // use this to further randomize dinosaur marker movement extent
    let offSet = Math.ceil(Math.random() * 10);
    let x = input;
    let y = (Math.ceil(Math.random() * 10) - offSet);
    let result = x + y;
    return result.toString();
}

// Function for random marker movement, must remain with padock, input is the current mapMarker item
function randomWithin(input) {
    paddockLookup(input.paddockId.S);
    // Reset boolean and attempts for looping random marker movement within the padock
    let within = false;
    let attempts = 0;
    while (!within) {
        // Set/reset tempItem to input mapMarker item
        let tempItem = input;
        // Perform random coordinate attempt
        tempItem.xcoord.N = random(parseInt(input.xcoord.N));
        tempItem.ycoord.N = random(parseInt(input.ycoord.N));
        let tempCoords = helpers.point([
            parseInt(tempItem.xcoord.N),
            parseInt(tempItem.ycoord.N)
        ]);
        // Test for temporary coordinates attempt valid (within boundaries)
        if (turf.booleanPointInPolygon(tempCoords, paddock)) {
            console.log("Updating marker:", tempItem.name.S);
            console.log("New coords:", tempItem.xcoord.N, ",", tempItem.ycoord.N);
            newItem = tempItem;
            return true;
        }
        else {
            // Check for too many attempts
            if (attempts == 10) {
                console.log("MARKER OUT OF BOUNDS");
                return;
            }
            // Continue mapMarker update attempts
            else {
                console.log("NOT WITHIN, RETRYING");
                attempts++;
            }
        }
    }
}

//Function handler code
exports.mapMarkerHandler = (event, context, callback) => {
    // Log the received input data event
    console.log('InputRecieved: ', JSON.stringify(event));
    // Populate DynamoDB client parameters
    let params = {
        TableName: 'mapMarker-yr5q33is7ngxno7igxguwgezye-dev',
        Key: { 'id': { S: event.id } }
    };
    // Call DynamoDB to read the mapMarker item current coordinates from the table
    dynamodb.getItem(params, function(err, data) {
        // Check for getItem errors
        if (err) {
            console.log(err, err.stack);
            callback(null, {
                statusCode: '500',
                body: err
            });
        }
        // Successfull getItem, proceed to random increment update and paddock validation
        else {
            // Call mapMarker randomWithin function
            randomWithin(data.Item);
            // Write newItem back to DDB
            dynamodb.putItem({
                TableName: 'mapMarker-yr5q33is7ngxno7igxguwgezye-dev',
                Item: newItem
            }, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    callback(null, {
                        statusCode: '500',
                        body: err
                    });
                }
                else {
                    callback(null, {
                        statusCode: '200',
                        body: 'SUCCESS'
                    });
                }
            });
        }
    });
};
