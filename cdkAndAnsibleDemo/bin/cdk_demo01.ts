#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkDemo01Stack } from '../lib/cdk_demo01-stack';

const app = new cdk.App();
new CdkDemo01Stack(app, 'CdkDemo01Stack');
