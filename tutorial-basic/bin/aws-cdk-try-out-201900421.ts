#!/usr/bin/env node
import "source-map-support/register";
import cdk = require("@aws-cdk/cdk");
import { AwsCdkTryOut201900421Stack } from "../lib/aws-cdk-try-out-201900421-stack";

const app = new cdk.App();
new AwsCdkTryOut201900421Stack(app, "AwsCdkTryOut201900421Stack");
