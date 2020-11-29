import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as A from '../lib/a-stack';

test('toDO', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new A.AStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(haveResource("AWS::SQS::{Infra}",{
      VisibilityTimeout: 300
    }));
});