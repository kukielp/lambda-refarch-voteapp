import * as cdk from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cognito from '@aws-cdk/aws-cognito';

const pinpoint =  require("@aws-cdk/aws-pinpoint");


export class AStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    this.build_cognito();


  
    //this is needed by the web UI
  //  var identity_pool_id = idp.openIdConnectProviderArns;

    //dynamo tables
    const VotesTable = new dynamodb.Table(this, 'VoteApp', {
      partitionKey: { 
        name: 'id', 
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });
  

    const AggregatesTable = new dynamodb.Table(this, 'AggregatesTable', {
      partitionKey: { 
        name: 'id', 
        type: dynamodb.AttributeType.STRING 
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    
    //sample lambda - feel free to delete
    const handler = new lambda.Function(this, "WidgetHandler", {
      runtime: lambda.Runtime.NODEJS_10_X, // So we can use async in widget.js
      code: lambda.Code.asset("resources"),
      handler: "widgets.main"
    });

    //security for DDB
    AggregatesTable.grantReadWriteData(handler);
    VotesTable.grantReadWriteData(handler);

    //Pinpoint Project
    const pinpointProject = new pinpoint.CfnApp(this, "vote4cdk", {
      name: "vote4cdk"
    });

    //Pipoint SNS topic
    const topic = new sns.Topic(this, 'Topic', {
      displayName: 'Pinpoint Incomming subscription topic'
    });

  };


  private build_cognito() {
    
       //cognito
/*
      const userPool = new cognito.UserPool(this, 'voting-UserPool', {
          signInType: SignInType.EMAIL,
          autoVerifiedAttributes: [
              UserPoolAttribute.EMAIL
          ]
      });
      const cfnUserPool = userPool.node.defaultChild as cognito.CfnUserPool;
      cfnUserPool.policies = {
          passwordPolicy: {
              minimumLength: 8,
              requireLowercase: false,
              requireNumbers: false,
              requireUppercase: false,
              requireSymbols: false
          }
      };
      const userPoolClient = new cognito.UserPoolClient(this, 'voting-UserPoolClient', {
          generateSecret: false,
          userPool: userPool,
          userPoolClientName: 'voting-UserPoolClientName'
      });
      const identityPool = new cognito.CfnIdentityPool(this, 'voting-IdentityPool', {
          allowUnauthenticatedIdentities: false,
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

      */

  }
}