console.log('Loading event');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();

exports.handler = function(event, context) {

    let totalRed = 0;
    let totalGreen = 0;
    let totalBlue = 0;

    event.Records.forEach(function(record) {

        let votedForHash = record.dynamodb['NewImage']['VotedFor']['S'];
        let numVotes = record.dynamodb['NewImage']['Votes']['N'];

        // Determine the color on which to add the vote
        if (votedForHash.indexOf("RED") > -1) {
            votedFor = "RED";
            totalRed += parseInt(numVotes);
        } else if (votedForHash.indexOf("GREEN") > -1) {
            votedFor = "GREEN";
            totalGreen +=  parseInt(numVotes);
        } else if (votedForHash.indexOf("BLUE") > -1) {
            votedFor = "BLUE";
            totalBlue += parseInt(numVotes);
        } else {
            console.log("Invalid vote: ", votedForHash);
        }
    });

    // Update the aggregation table with the total of RED, GREEN, and BLUE
    // votes received from this series of updates
//fix this it's hard coded.
    const aggregatesTable = 'vote4cdk-AggregatesTable0F8EFB12-G52M2F3XSUKY';
    if (totalRed > 0) updateAggregateForColor("RED", totalRed);
    if (totalBlue > 0) updateAggregateForColor("BLUE", totalBlue);
    if (totalGreen > 0) updateAggregateForColor("GREEN", totalGreen);

    console.log('Updating Aggregates Table', totalRed);

    function updateAggregateForColor(votedFor, numVotes) {
        console.log("Updating Aggregate Color ", votedFor);
        console.log("For NumVotes: ", numVotes);

        dynamodb.updateItem({
            'TableName': aggregatesTable,
            'Key': { 'VotedFor' : { 'S': votedFor }},
            'UpdateExpression': 'add #vote :x',
            'ExpressionAttributeNames': {'#vote' : 'Vote'},
            'ExpressionAttributeValues': { ':x' : { "N" : numVotes.toString() } }
        }, function(err, data) {
            if (err) {
                console.log(err);
                context.fail("Error updating Aggregates table: ", err)
            } else {
                console.log("Vote received for %s", votedFor);
                context.succeed("Successfully processed " + event.Records.length + " records.");
            }
        });
    }
};