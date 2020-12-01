import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as s3 from '@aws-cdk/aws-s3'

export class NextjsCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const bucket = new s3.Bucket(this, 'NextjsAppBucket')

    const handler = new lambda.Function(this, 'BuildNextjs', {
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 256,
      timeout: cdk.Duration.minutes(5),
      environment: {
        DEPLOY_BUCKET: bucket.bucketName,
        SOURCE_URL: '',
      },
    })

    bucket.grantWrite(handler)
  }
}
