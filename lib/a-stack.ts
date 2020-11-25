import * as cdk from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns';
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

    //security for DDB
    AggregatesTable.grantReadWriteData(lambdaReceiveVote);
    VotesTable.grantReadWriteData(lambdaAggregateVote);

    //Pinpoint Project
    const pinpointProject = new pinpoint.CfnApp(this, "vote4cdk", {
      name: "vote4cdk"
    });

    //Pipoint SNS topic
    const topic = new sns.Topic(this, 'Topic', {
      displayName: 'Pinpoint Incomming subscription topic'
    });

  }
}