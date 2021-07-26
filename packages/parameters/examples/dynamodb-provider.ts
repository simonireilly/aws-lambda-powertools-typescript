import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { DynamoDBProvider } from '../src';
import { Handler } from 'aws-lambda';

const provider = new DynamoDBProvider('TestTable');

const lambdaHandler: Handler = async () => {

  const parameter = await provider.get('someValue');
  console.log(parameter);

  const parameters = await provider.getMultiple('someValue');
  console.log(parameters);

};

lambdaHandler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));