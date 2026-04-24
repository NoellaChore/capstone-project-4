import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

export class CapstoneProject4Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Create SSM Parameter
    const configParam = new ssm.StringParameter(this, 'AppGreeting', {
      parameterName: '/app/config/greeting',
      stringValue: 'Hello from CI/CD Automated Infrastructure!',
    });

    // 2. Create Lambda
    const myLambda = new lambda.Function(this, 'WorkflowTask', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
    });

    // Grant Lambda permissions to read the SSM parameter
    configParam.grantRead(myLambda);

    // 3. Create Step Function Task with Retries
    const submitTask = new tasks.LambdaInvoke(this, 'Invoke Task', {
      lambdaFunction: myLambda,
    });

    submitTask.addRetry({ maxAttempts: 2 });

    // 4. Define State Machine
    new stepfunctions.StateMachine(this, 'MyStateMachine', {
      definition: submitTask,
    });
  }
}