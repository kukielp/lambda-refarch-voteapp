import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';

const pinpoint =  require("@aws-cdk/aws-pinpoint");

export class AStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    //dynamo tables
    const VotesTable = new dynamodb.Table(this, 'VoteApp', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });
   
    const AggregatesTable = new dynamodb.Table(this, 'AggregatesTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });


    const pinpointProject = new pinpoint.CfnApp(this, "vote4cdk", {
      name: "vote4cdk"
    });

      /**
       * Lambda Construct for aggregate-votes
       * **/
      const lambdaAggregateVote = new lambda.Function(this, 'VoteAppAggregateVotes', {
          runtime: lambda.Runtime.NODEJS_10_X,
          handler: 'app.handler',
          code: lambda.Code.fromAsset('lambda-functions/aggregate-votes'),
      });
      /**
       * Lambda Construct for receive-vote
       * **/
      const lambdaReceiveVote = new lambda.Function(this, 'VoteAppReceiveVote', {
          runtime: lambda.Runtime.NODEJS_10_X,
          handler: 'app.handler',
          code: lambda.Code.fromAsset('lambda-functions/receive-vote'),
      });

      /**
       * Grant the APIGateway permissions to invoke VoteAppReceiveVote lambda
       * **/
      //lambdaReceiveVote.grantInvoke(APIGateway-goes-here)


      //security for DDB
      AggregatesTable.grantReadWriteData(lambdaAggregateVote);
      VotesTable.grantReadWriteData(lambdaReceiveVote);
  }
}
