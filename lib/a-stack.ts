import * as cdk from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import { DynamoEventSource, SqsDlq } from '@aws-cdk/aws-lambda-event-sources';
import * as cognito from '@aws-cdk/aws-cognito';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam';
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';
import * as sqs from '@aws-cdk/aws-sqs';

const pinpoint =  require("@aws-cdk/aws-pinpoint");

export class AStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //dynamo tables
    const VotesTable = new dynamodb.Table(this, 'VoteApp', {
      partitionKey: { name: 'VotedFor', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_IMAGE // make sure stream is configured
    });

    const AggregatesTable = new dynamodb.Table(this, 'AggregatesTable', {
      partitionKey: { name: 'VotedFor', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    //lambda functions
    const lambdaAggregateVote = new lambda.Function(this, 'VoteAppAggregateVotes', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'app.handler',
      code: lambda.Code.fromAsset('lambda-functions/aggregate-votes'),
    });

    //hook up aggregate vote to aggregate table stream
    const deadLetterQueue = new sqs.Queue(this, 'deadLetterQueue');
    lambdaAggregateVote.addEventSource(new DynamoEventSource(VotesTable, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      batchSize: 5,
      bisectBatchOnError: true,
      onFailure: new SqsDlq(deadLetterQueue),
      retryAttempts: 10
    }));

    VotesTable.grantStreamRead(lambdaAggregateVote);
 
    /**
     * Lambda Construct for receive-vote
     * **/
    const lambdaReceiveVote = new lambda.Function(this, 'VoteAppReceiveVote', {
        runtime: lambda.Runtime.NODEJS_10_X,
        handler: 'app.handler',
        code: lambda.Code.fromAsset('lambda-functions/receive-vote'),
    });

    //security for DDB
    VotesTable.grantReadWriteData(lambdaReceiveVote);
    AggregatesTable.grantReadWriteData(lambdaAggregateVote);
    
    //Pinpoint Project
    const pinpointProject = new pinpoint.CfnApp(this, "vote4cdk", {
      name: "vote4cdk"
    });

    //Pinpoint SNS topic
    const topic = new sns.Topic(this, 'Topic', {
      displayName: 'Pinpoint Incomming subscription topic'
    });


    //API Gateway
    // defines an API Gateway REST API resource backed by our "hello" function.
//todo this is not workin 
    const mappingVTL = `{
        #foreach( $token in $input.path('$').split('&') )
            #set( $keyVal = $token.split('=') )
            #set( $keyValSize = $keyVal.size() )
            #if( $keyValSize >= 1 )
                #set( $key = $util.urlDecode($keyVal[0]) )
                #if( $keyValSize >= 2 )
                    #set( $val = $util.urlDecode($keyVal[1]) )
                #else
                    #set( $val = '' )
                #end
                "$key": "$val"#if($foreach.hasNext),#end
            #end
        #end
    }`
    const lambdaIntegration = new apigw.LambdaIntegration(lambdaReceiveVote, {
      requestTemplates: {
        'application/x-www-form-urlencoded': mappingVTL
      }
    });
    const api = new apigw.RestApi(this, 'vote-api');
    api.root.addMethod('ANY');
    const vote = api.root.addResource('vote');
    vote.addMethod('POST',lambdaIntegration);
  }
}