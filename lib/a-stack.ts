import * as cdk from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cognito from '@aws-cdk/aws-cognito';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam';
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';

const pinpoint =  require("@aws-cdk/aws-pinpoint");

export class AStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    //this.build_cognito(scope);


  
    //this is needed by the web UI
  //  var identity_pool_id = idp.openIdConnectProviderArns;

    //dynamo tables
    const VotesTable = new dynamodb.Table(this, 'VoteApp', {
      partitionKey: { name: 'VotedFor', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });
  

    const AggregatesTable = new dynamodb.Table(this, 'AggregatesTable', {
      partitionKey: { name: 'VotedFor', type: dynamodb.AttributeType.STRING },
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
    VotesTable.grantReadWriteData(lambdaReceiveVote);
    AggregatesTable.grantReadWriteData(lambdaAggregateVote);
    
    //Pinpoint Project
    const pinpointProject = new pinpoint.CfnApp(this, "vote4cdk", {
      name: "vote4cdk"
    });

    //Pipoint SNS topic
    const topic = new sns.Topic(this, 'Topic', {
      displayName: 'Pinpoint Incomming subscription topic'
    });


    //API Gateway
    // defines an API Gateway REST API resource backed by our "hello" function.
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


  
  private build_cognito(scope: cdk.App) {
    
    //cognito

   const userPool = new cognito.UserPool(this, 'voting-UserPool');

   const userPoolClient = new cognito.UserPoolClient(this, 'voting-UserPoolClient', {
       generateSecret: false,
       userPool: userPool,
       userPoolClientName: 'voting-UserPoolClientName'
   });
   const identityPool = new cognito.CfnIdentityPool(this, 'voting-IdentityPool', {
       allowUnauthenticatedIdentities: true,
       cognitoIdentityProviders: [{
           clientId: userPoolClient.userPoolClientId,
           providerName: userPool.userPoolProviderName,
       }]
   });

   const unauthenticatedRole = new iam.Role(this, 'CognitoDefaultUnauthenticatedRole', {
       assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
           "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
           "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "unauthenticated" },
       }, "sts:AssumeRoleWithWebIdentity"),
   });
   unauthenticatedRole.addToPolicy(new PolicyStatement({
       effect: Effect.ALLOW,
       actions: [
           "mobileanalytics:PutEvents",
           "cognito-sync:*"
       ],
       resources: ["*"],
   }));
   const authenticatedRole = new iam.Role(this, 'CognitoDefaultAuthenticatedRole', {
       assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
           "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
           "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" },
       }, "sts:AssumeRoleWithWebIdentity"),
   });
   authenticatedRole.addToPolicy(new PolicyStatement({
       effect: Effect.ALLOW,
       actions: [
           "mobileanalytics:PutEvents",
           "cognito-sync:*",
           "cognito-identity:*"
       ],
       resources: ["*"],
   }));
   const defaultPolicy = new cognito.CfnIdentityPoolRoleAttachment(this, 'DefaultValid', {
       identityPoolId: identityPool.ref,
       roles: {
           'unauthenticated': unauthenticatedRole.roleArn,
           'authenticated': authenticatedRole.roleArn
       }
   });

 }

}