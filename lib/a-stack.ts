import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';
import {ManagedPolicy} from "@aws-cdk/aws-iam";

export class AStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * Lambda Construct for aggregate-votes
     * **/
    const lambdaAggregateVote = new lambda.Function(this, 'VoteAppAggregateVotes', {
        runtime: lambda.Runtime.NODEJS_10_X,
        handler: 'app.handler',
        code: lambda.Code.fromAsset('lambda-functions/aggregate-votes'),
    });
    /**
     * Provide list and read access to DynamoDB sterams and write to CloudWatch
     * **/
     lambdaAggregateVote?.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AWSLambdaDynamoDBExecutionRole"))


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
  }
}
