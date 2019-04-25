#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/cdk');
import { TutorialEcsStack } from '../lib/tutorial-ecs-stack';

const app = new cdk.App();
new TutorialEcsStack(app, 'TutorialEcsStack');
