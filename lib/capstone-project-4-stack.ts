import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';

export class CapstoneProject4Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const configParam = new ssm.StringParameter(this, 'AppGreeting', {
      parameterName: '/app/config/greeting',
      stringValue: 'Hello from CI/CD Automated Infrastructure!',
    });

    const myLambda = new lambda.Function(this, 'WorkflowTask', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
    });

    configParam.grantRead(myLambda);

    const submitTask = new tasks.LambdaInvoke(this, 'Invoke Task', {
      lambdaFunction: myLambda,
    });

    submitTask.addRetry({ maxAttempts: 2 });

    new stepfunctions.StateMachine(this, 'MyStateMachine', {
      definitionBody: stepfunctions.DefinitionBody.fromChainable(submitTask),
    });

    const sourceOutput = new codepipeline.Artifact();

    const githubToken = cdk.SecretValue.secretsManager('github-token');

    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: 'NoellaChore',
      repo: 'capstone-project-4',
      branch: 'main',
      oauthToken: githubToken,
      output: sourceOutput,
    });

    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: { commands: ['npm install'] },
          build: { commands: ['npm run build'] },
        },
      }),
    });

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build',
      project: buildProject,
      input: sourceOutput,
    });

    new codepipeline.Pipeline(this, 'MyPipeline', {
      stages: [
        { stageName: 'Source', actions: [sourceAction] },
        { stageName: 'Build', actions: [buildAction] },
      ],
    });
  }
}
