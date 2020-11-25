#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { AStack } from '../lib/a-stack';

const app = new cdk.App();

new AStack(app, 'vote4cdk', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});