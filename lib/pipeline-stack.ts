import * as codepipeline from '@aws-cdk/aws-codepipeline'
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions'
import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core'
import { CdkPipeline, SimpleSynthAction, ShellScriptAction } from '@aws-cdk/pipelines'
import { NextjsStageStack } from './nextjs-stage-stack'

SecretValue.secretsManager

/**
 * The stack that defines the application pipeline
 */
export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const sourceArtifact = new codepipeline.Artifact()
    const cloudAssemblyArtifact = new codepipeline.Artifact()
 
    const pipeline = new CdkPipeline(this, 'Pipeline', {
      // The pipeline name
      pipelineName: 'MyServicePipeline',
      cloudAssemblyArtifact,
      // Where the source can be found
      sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        oauthToken: SecretValue.secretsManager('matsunaga-github-token', {
          jsonField: 'token',
        }),
        owner: 'aYutaMatsunaga',
        repo: 'nextjs-cdk',
      }),

       // How it will be built and synthesized
       synthAction: SimpleSynthAction.standardNpmSynth({
         sourceArtifact,
         cloudAssemblyArtifact,
         
         // We need a build step to compile the TypeScript Lambda
         buildCommand: 'npm run build'
       }),
    })

    // This is where we add the application stages
    const preprod = new NextjsStageStack(this, 'PreProd')
    const preprodStage = pipeline.addApplicationStage(preprod)
    preprodStage.addActions(new ShellScriptAction({
      actionName: 'TestService',
      useOutputs: {
        // Get the stack Output from the Stage and make it available in
        // the shell script as $ENDPOINT_URL.
        ENDPOINT_URL: pipeline.stackOutput(preprod.urlOutput),
      },
      commands: [
        // Use 'curl' to GET the given URL and fail if it returns an error
        'curl -Ssf $ENDPOINT_URL',
      ],
    }))
  }
}