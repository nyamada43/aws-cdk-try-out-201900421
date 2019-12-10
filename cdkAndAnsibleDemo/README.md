# Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

# 初回構築手順

- aws cdkは現在アップデートが速いようなので適宜

```
npm install -g aws-cdk
npx npm-check-updates -u
```

# watch

```
npm run watch
```

# 構成

packer-post-processor-amazon-ami-management
https://github.com/wata727/packer-post-processor-amazon-ami-management

# やること

github => code deploy => ec2 Autoscaling
EC2 => kinesis firehose => ElasticSearch


Route53, ALB, Cloudfront, WAF => ドキュメント
RDS, redis => ドキュメント
EC2, ECS => code
API Gateway => repositoy

メンテナンス課題

# やらないこと