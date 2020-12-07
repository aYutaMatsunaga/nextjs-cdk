import * as cdk from '@aws-cdk/core'
import * as ecr from '@aws-cdk/aws-ecr'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import * as iam from '@aws-cdk/aws-iam'
import * as s3 from '@aws-cdk/aws-s3'
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns'

export class NextjsCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    new s3.Bucket(this, 'nextjs-app', {
      bucketName: 'ufoo68-next-app',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteErrorDocument: '404.html',
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
    })

    const taskRole = new iam.Role(this, "fargate-test-task-role", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com")
    })

    // Define a fargate task with the newly created execution and task roles
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
    // Import a local docker image and set up logger
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

    // NOTE: I've been creating a new VPC in us-east-2 (Ohio) to keep it clean, so se that at the top in stackProps
    // Create a vpc to hold everything - this creates a brand new vpc
    // Remove this if you are using us-east-1 and the existing non-prod vpc as commented out below
    const vpc = new ec2.Vpc(this, "fargate-test-task-vpc", {
      maxAzs: 2,
      natGateways: 1,
    })

    // Create the cluster
    const cluster = new ecs.Cluster(this, "fargate-test-task-cluster", { vpc })

    // Create a load-balanced Fargate service and make it public
    new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "MyFargateService",
      {
        cluster, // Required
        cpu: 512, // Default is 256
        desiredCount: 2, // Default is 1
        taskDefinition,
        memoryLimitMiB: 2048, // Default is 512
        publicLoadBalancer: true // Default is false
      }
    )
  }
}
