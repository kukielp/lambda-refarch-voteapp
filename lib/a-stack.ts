import * as cdk from '@aws-cdk/core';
const pinpoint =  require("@aws-cdk/aws-pinpoint");

export class AStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pinpointProject = new pinpoint.CfnApp(this, "vote4cdk", {
      name: "vote4cdk"
    });
  }
}
