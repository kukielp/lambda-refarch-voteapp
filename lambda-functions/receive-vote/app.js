console.log('Loading event');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10', region: 'us-east-1'}));

exports.handler = function(event, context) {
  let twilio = require('twilio');
  
  /* Make sure we have a valid vote (one of [RED, GREEN, BLUE]) */
  console.log("-----------------");
  console.log(event);
  console.log("-----------------");
  
  const votedFor = event['Body'].toUpperCase().trim();
  if (['RED', 'GREEN', 'BLUE'].indexOf(votedFor) >= 0) {
    /* Add randomness to our value to help spread across partitions */
    votedForHash = votedFor + "." + Math.floor((Math.random() * 10) + 1).toString();
    /* ...updateItem into our DynamoDB database */
    let tableName = 'vote4cdk-VoteAppAF22FC8B-DQ5ZQQQ95X8O';
    dynamodb.updateItem({
      'TableName': tableName,
      'Key': { 'VotedFor' : { 'S': votedForHash }},
      'UpdateExpression': 'add #vote :x',
      'ExpressionAttributeNames': {'#vote' : 'Votes'},
      'ExpressionAttributeValues': { ':x' : { "N" : "1" } }
    }, function(err, data) {
      if (err) {
        console.log(err);
        context.fail(err);
      } else {
        let resp = new twilio.twiml.MessagingResponse();
        resp.message("Thank you for casting a vote for " + votedFor);
        context.done(null, [resp.toString()]);
        console.log("Vote received for %s", votedFor);
      }
    });
  } else {
    console.log("Invalid vote received (%s)", votedFor);
    context.fail("Invalid vote received");
  }
}