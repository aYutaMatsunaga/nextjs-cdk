import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core'
import { NextjsCdkStack } from './nextjs-cdk-stack'

/**
 * Deployable unit of web service app
 */
export class NextjsStageStack extends Stage {
    public readonly urlOutput: CfnOutput

    constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props)

        const service = new NextjsCdkStack(this, 'WebService')
        this.urlOutput = service.urlOutput
    }
}