import * as cdk from '@aws-cdk/core'
import * as ecr from '@aws-cdk/aws-ecr'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import * as iam from '@aws-cdk/aws-iam'
import * as s3 from '@aws-cdk/aws-s3'
import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns'
import { v4 as uuidv4 } from 'uuid'

export class NextjsCdkStack extends cdk.Stack {
  public readonly urlOutput: cdk.CfnOutput
  
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const bucket = new s3.Bucket(this, 'nextjs-app', {
      versioned: false,
      bucketName: 'ufoo68-next-app',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const oai = new cloudfront.OriginAccessIdentity(
      this,
      "nextjs-on-ecs-cloudfront-oai",
      {
        comment: "s3 access."
      }
    );

    bucket.grantRead(oai)

    const taskRole = new iam.Role(this, "fargate-test-task-role", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com")
    })

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "fargate-task-definition",
      {
        taskRole: taskRole as any,
        executionRole: taskRole as any,
      }
    )

    const repository = new ecr.Repository(this, 'myRepoName', {
      repositoryName: 'ufoo68/hello-world',
    })

    const container = taskDefinition.addContainer(
      "fargate-test-task-container",
      {
        image: ecs.ContainerImage.fromEcrRepository(repository as any),
        logging: new ecs.AwsLogDriver({
          streamPrefix: "fargate-test-task-log-prefix"
        })
      }
    )

    container.addPortMappings({
      containerPort: 80,
      hostPort: 80,
      protocol: ecs.Protocol.TCP
    })

    const vpc = new ec2.Vpc(this, "fargate-test-task-vpc", {
      maxAzs: 2,
      natGateways: 1,
    })

    const cluster = new ecs.Cluster(this, "fargate-test-task-cluster", { vpc })

    const fargate = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      `MyFargateService-${uuidv4()}`,
      {
        cluster,
        cpu: 512,
        desiredCount: 2,
        taskDefinition,
        memoryLimitMiB: 2048,
        publicLoadBalancer: true,
      }
    )

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "nextjs-on-ecs-cloudfront",
      {
        defaultRootObject: "",
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: bucket,
              originAccessIdentity: oai
            },
            behaviors: [
              {
                pathPattern: "/_next/static/*",
                compress: true,
                maxTtl: cdk.Duration.seconds(0),
                minTtl: cdk.Duration.seconds(0),
                defaultTtl: cdk.Duration.seconds(0),
              }
            ]
          },
          {
            customOriginSource: {
              domainName: fargate.loadBalancer.loadBalancerDnsName,
              originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
                allowedMethods: cloudfront.CloudFrontAllowedMethods.ALL,
                forwardedValues: {
                  queryString: true,
                  cookies: {
                    forward: "all"
                  }
                },
                maxTtl: cdk.Duration.seconds(0),
                minTtl: cdk.Duration.seconds(0),
                defaultTtl: cdk.Duration.seconds(0),
              }
            ]
          }
        ]
      }
    )

    this.urlOutput = new cdk.CfnOutput(this, 'cloudfrontUrl', {
      value: `https://${distribution.distributionDomainName}`
    })
  }
}
