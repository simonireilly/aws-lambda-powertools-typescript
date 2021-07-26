import { strict as assert } from 'assert';
import { BaseProvider } from './BaseProvider';
import { DynamoDBClient, DynamoDBClientConfig, GetItemCommand, GetItemCommandInput, AttributeValue } from '@aws-sdk/client-dynamodb';

class DynamoDBProvider extends BaseProvider {
  public client: DynamoDBClient;
  
  public keyAttr?: string;
  
  public sortAttr?: string;
  
  public tableName?: string;

  public valueAttr?: string;

  public constructor(tableName: string, keyAttr: string = 'id', sortAttr: string = 'sk', valueAttr: string = 'value', config: DynamoDBClientConfig = {}) {
    super();
    this.client = new DynamoDBClient(config);

    this.tableName = tableName;
    this.keyAttr = keyAttr;
    this.sortAttr = sortAttr;
    this.valueAttr = valueAttr;
  }

  public async _get(name: string, sdkOptions?: GetItemCommand): Promise<string | undefined> {
    let result;
    if (sdkOptions === undefined) {
      assert(this.keyAttr !== undefined);
      /* const keyVal: { [key: string]: AttributeValue } = {};
      keyVal[this.keyAttr] = name; */
      const command = new GetItemCommand({
        TableName: this.tableName,
        Key: {
          'id': {
            'S': name
          }
        }
      });

      result = await this.client.send(command);
    } else {
      result = await this.client.send(sdkOptions);
    }

    return result.Item;
  }

  public _getMultiple(_path: string): Promise<Record<string, string | undefined>> {
    throw Error('Not implemented.');
  }
}

export {
  DynamoDBProvider
};