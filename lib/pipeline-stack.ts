import * as codepipeline from '@aws-cdk/aws-codepipeline'
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions'
import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core'
import { CdkPipeline, SimpleSynthAction, ShellScriptAction } from '@aws-cdk/pipelines'
import { NextjsStageStack } from './nextjs-stage-stack'

SecretValue.secretsManager
export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const sourceArtifact = new codepipeline.Artifact()
    const cloudAssemblyArtifact = new codepipeline.Artifact()

    const pipeline = new CdkPipeline(this, 'Pipeline', {
      pipelineName: 'MyServicePipeline',
      cloudAssemblyArtifact,
      sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        oauthToken: SecretValue.secretsManager('matsunaga-github-token', {
          jsonField: 'token',
        }),
        owner: 'aYutaMatsunaga',
        repo: 'nextjs-cdk',
      }),
      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        buildCommand: 'npm run build',
      }),
    })

    const preprod = new NextjsStageStack(this, 'PreProd')
    const preprodStage = pipeline.addApplicationStage(preprod)
    preprodStage.addManualApprovalAction()

    const prod = new NextjsStageStack(this, 'Prod')
    pipeline.addApplicationStage(prod)
  }
}