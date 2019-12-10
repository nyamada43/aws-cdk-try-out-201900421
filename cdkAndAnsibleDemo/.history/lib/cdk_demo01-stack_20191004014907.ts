import { Vpc, SubnetType, InstanceType, InstanceClass, InstanceSize, AmazonLinuxImage, SubnetSelection } from "@aws-cdk/aws-ec2";
import autoscaling = require('@aws-cdk/aws-autoscaling');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import cdk = require('@aws-cdk/core');
import { Role, ServicePrincipal, ManagedPolicy, Policy, PolicyStatement, Effect} from "@aws-cdk/aws-iam";
import * as codebuild from '@aws-cdk/aws-codebuild';
import codedeploy = require("@aws-cdk/aws-codedeploy");

export class CdkDemo01Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const deployEnv = this.node.tryGetContext("env")
    const appName = `${deployEnv}-demoApp`

    // NETWORK
    let cidr: string | null
    if (deployEnv === 'dev') {
      cidr = '10.0.0.0/16'
    } else {
      throw new Error(`Unknown env: ${deployEnv}`)
    }

    const vpc = new Vpc(this, `${appName}-Vpc`, {
      cidr: cidr,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${deployEnv}-public`,
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `${deployEnv}-private`,
          subnetType: SubnetType.ISOLATED,
        },
      ],
    })

    vpc.node.applyAspect(new cdk.Tag("env", `${deployEnv}`))

    // ASG
    const asgEc2Role = new Role(this, 'EC2RoleforSSM',{
      assumedBy: new ServicePrincipal('ec2.amazonaws.com')
    })

    asgEc2Role.node.applyAspect(new cdk.Tag("env", `${deployEnv}`))

    const asgEc2PolicyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      resources: ["*"],
      actions: [
          "ec2:DescribeAddresses",
          "ec2:AllocateAddress",
          "ec2:DescribeInstances",
          "ec2:AssociateAddress"
      ],
    })

    const asgEc2Policy = new Policy(this, `${appName}-ElasticIP-Policy`,{
      statements: [asgEc2PolicyStatement],
    })

    asgEc2Policy.node.applyAspect(new cdk.Tag("env", `${deployEnv}`))

    asgEc2Role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2RoleforSSM'))
    asgEc2Role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'))
    asgEc2Role.attachInlinePolicy(asgEc2Policy)

    const asg = new autoscaling.AutoScalingGroup(this, `${appName}-ASG`, {
      vpc,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.SMALL),
      machineImage: new AmazonLinuxImage(),
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      // notificationsTopic: { topicArn: ''},
      role: asgEc2Role,
    })

    asg.node.applyAspect(new cdk.Tag("env", `${deployEnv}`))

    asg.addUserData(
      "yum -y update",
      "sudo yum install -y ruby wget",
      "wget -P /home/ec2-user https://bucket-name.s3.region-identifier.amazonaws.com/latest/install",
      "chmod +x /home/ec2-user/install",
      "sudo /home/ec2-user/install auto",
    );

    // LB
    const lb = new elbv2.ApplicationLoadBalancer(this, `${appName}-LB`, {
      vpc,
      internetFacing: true,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
    })

    lb.node.applyAspect(new cdk.Tag("env", `${deployEnv}`))

    const listener = lb.addListener('Listener', {
      port: 80,
    });

    const targetGroup = listener.addTargets('Target', {
      port: 80,
      targets: [asg]
    });

    listener.connections.allowDefaultPortFromAnyIpv4();

    asg.scaleOnRequestCount('AModestLoad', {
      targetRequestsPerSecond: 1
    });

    // codebuild is independent from pipeline
    const codebuildRole = new Role(this, `${deployEnv}-coodebuild`,{
      assumedBy: new ServicePrincipal('codebuild.amazonaws.com')
    })

    codebuildRole.node.applyAspect(new cdk.Tag("env", `${deployEnv}`))

    const codebuildPolicyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      resources: ["*"],
      actions: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "ec2:AttachVolume",
        // for packer
                "ec2:AuthorizeSecurityGroupIngress",
                "ec2:CopyImage",
                "ec2:CreateImage",
                "ec2:CreateKeypair",
                "ec2:CreateSecurityGroup",
                "ec2:CreateSnapshot",
                "ec2:CreateTags",
                "ec2:CreateVolume",
                "ec2:DeleteKeyPair",
                "ec2:DeleteSecurityGroup",
                "ec2:DeleteSnapshot",
                "ec2:DeleteVolume",
                "ec2:DeregisterImage",
                "ec2:DescribeImageAttribute",
                "ec2:DescribeImages",
                "ec2:DescribeInstances",
                "ec2:DescribeInstanceStatus",
                "ec2:DescribeRegions",
                "ec2:DescribeSecurityGroups",
                "ec2:DescribeSnapshots",
                "ec2:DescribeSubnets",
                "ec2:DescribeTags",
                "ec2:DescribeVolumes",
                "ec2:DetachVolume",
                "ec2:GetPasswordData",
                "ec2:ModifyImageAttribute",
                "ec2:ModifyInstanceAttribute",
                "ec2:ModifySnapshotAttribute",
                "ec2:RegisterImage",
                "ec2:RunInstances",
                "ec2:StopInstances",
                "ec2:TerminateInstances"
      ],
    })

    const codebuildPolicy = new Policy(this, `${appName}-codebuild-Policy`,{
      statements: [codebuildPolicyStatement],
    })

    codebuildPolicy.node.applyAspect(new cdk.Tag("env", `${deployEnv}`))

    codebuildRole.attachInlinePolicy(codebuildPolicy)


    const gitHubSource = codebuild.Source.gitHub({
      owner: 'nyamada43',
      repo: 'demoAWSIaS',
      webhook: true,
      webhookFilters: [
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs('master'),
      ],
    });

    new codebuild.Project(this, `${appName}-codebuild`, {
      badge: true,
      role: codebuildRole,
      source: gitHubSource,
    })

    // codeDeploy
    const codeDeployRole = new Role(this, 'codeDeployRoleForASG',{
      assumedBy: new ServicePrincipal('codedeploy.amazonaws.com')
    })

    codeDeployRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSCodeDeployRole'))

    const demoAppDeploymentGroup = new codedeploy.ServerDeploymentGroup(this, `${appName}-codeDeploy-DG`,{
      application: new codedeploy.ServerApplication(this, `${appName}-codeDeploy-App`, {
        applicationName: `${appName}-codeDeploy-App`
      }),
      autoScalingGroups: [asg],
      deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
      role: codeDeployRole,
      installAgent: true,
      loadBalancer: codedeploy.LoadBalancer.application(targetGroup),
    })

  }
}
