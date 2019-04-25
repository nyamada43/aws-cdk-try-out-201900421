import cdk = require("@aws-cdk/cdk");
import s3 = require("@aws-cdk/aws-s3");
import { BucketEncryption } from "@aws-cdk/aws-s3";

export class AwsCdkTryOut201900421Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    new s3.Bucket(this, "MyFirstBucket", {
      versioned: true,
      encryption: BucketEncryption.KmsManaged
    });
  }
}
