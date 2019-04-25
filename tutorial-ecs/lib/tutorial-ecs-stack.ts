import cdk = require("@aws-cdk/cdk");
import ec2 = require("@aws-cdk/aws-ec2");
import ecs = require("@aws-cdk/aws-ecs");

export class TutorialEcsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const vpc = new ec2.VpcNetwork(this, "MyVpc", {
      maxAZs: 3
    });

    const cluster = new ecs.Cluster(this, "MyCluster", {
      vpc: vpc
    });

    new ecs.LoadBalancedFargateService(this, "MyFargateService", {
      cluster: cluster,
      cpu: "512",
      desiredCount: 2,
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryMiB: "2048",
      publicLoadBalancer: true
    });
  }
}
