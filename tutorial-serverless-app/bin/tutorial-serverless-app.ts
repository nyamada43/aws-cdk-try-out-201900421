#!/usr/bin/env node
import "source-map-support/register";
import cdk = require("@aws-cdk/cdk");
import { TutorialServerlessAppStack } from "../lib/tutorial-serverless-app-stack";

const app = new cdk.App();
new TutorialServerlessAppStack(app, "TutorialServerlessAppStack");
