import { BaseProvider } from '../../src/BaseProvider';
import { DEFAULT_PROVIDERS } from '../../src/BaseProvider';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { get_secret, SecretsProvider } from '../../src/SecretsProvider';

const defaultProviderGetSpy = jest.spyOn(DEFAULT_PROVIDERS, 'get');
const defaultProviderHasSpy = jest.spyOn(DEFAULT_PROVIDERS, 'has');
const clientSpy = jest.spyOn(SecretsManagerClient.prototype, 'send').mockImplementation(() => ({ SecretString: 'foo', }));

describe('Class: SecretsProvider', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Method: get', () => {
    test('when called, and the cache is empty, it returns a value from remote', async () => {

      // Prepare
      const provider = new SecretsProvider();

      // Act
      const value = await provider.get('my-parameter');

      // Assess
      expect(value).toEqual('foo');
      expect(clientSpy).toBeCalledWith(expect.objectContaining({
        input: expect.objectContaining({
          SecretId: 'my-parameter'
        })
      }));

    });

    test('when called, and a non-expired value exists in the cache, it returns it', async () => {

      // Prepare
      const provider = new SecretsProvider();
      const ttl = new Date();
      provider.store.set([ 'my-parameter', undefined ].toString(), { value: 'bar', ttl: ttl.setSeconds(ttl.getSeconds() + 600) });

      // Act
      const value = await provider.get('my-parameter');

      // Assess
      expect(value).toEqual('bar');
      expect(clientSpy).toBeCalledTimes(0);

    });

    test('when called, and an expired value exists in the cache, it returns a value from remote', async () => {

      // Prepare
      const provider = new SecretsProvider();
      const ttl = new Date();
      provider.store.set([ 'my-parameter', undefined ].toString(), { value: 'bar', ttl: ttl.setSeconds(ttl.getSeconds() - 600) });

      // Act
      const value = await provider.get('my-parameter');

      // Assess
      expect(value).toEqual('foo');
      expect(clientSpy).toBeCalledTimes(1);

    });

    test('when called with custom sdkOptions, it uses them, and it returns a value from remote', async () => {
      // Prepare
      const provider = new SecretsProvider();

      // Act
      const value = await provider.get('my-parameter', { sdkOptions: {
        VersionId: '7a9155b8-2dc9-466e-b4f6-5bc46516c84d'
      } });

      // Assess
      expect(value).toEqual('foo');
      expect(clientSpy).toBeCalledWith(expect.objectContaining({
        input: expect.objectContaining({
          SecretId: 'my-parameter',
          VersionId: '7a9155b8-2dc9-466e-b4f6-5bc46516c84d'
        })
      }));

    });

    test('when called with custom sdkOptions that should be overwritten, it use the correct ones, and it returns a value from remote', async () => {
      // Prepare
      const provider = new SecretsProvider();

      // Act
      const value = await provider.get('my-parameter', { sdkOptions: {
        SecretId: 'THIS_SHOULD_BE_OVERWRITTEN',
        VersionId: '7a9155b8-2dc9-466e-b4f6-5bc46516c84d'
      } });

      // Assess
      expect(value).toEqual('foo');
      expect(clientSpy).toBeCalledWith(expect.objectContaining({
        input: expect.objectContaining({
          SecretId: 'my-parameter',
          VersionId: '7a9155b8-2dc9-466e-b4f6-5bc46516c84d'
        })
      }));

    });

  });

  describe('Method: getMultiple', () => {
    test('when called, it throws', async () => {

      // Prepare
      const provider = new SecretsProvider();

      // Act / Assess
      expect.assertions(1);
      try {
        await provider.getMultiple('my-path');
      } catch (error) {
        expect(error.message).toEqual('Error: Not implemented.');
      }

    });

  });

});

describe('Function: get_secret', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('when called and a default provider DOES NOT exist, it creates one, and returns the value', async () => {
    // Prepare
    defaultProviderHasSpy.mockReturnValue(false);
  
    // Act
    const value = await get_secret('my-parameter');

    // Assess
    expect(value).toEqual('foo');
  });

  test('when called and a default provider exists, it uses it, and returns the value', async () => {
    // Prepare
    class TestProvider extends BaseProvider {
      public async _get(_name: string): Promise<string> {
        return new Promise((resolve, _reject) => resolve('foo'));
      }

      public _getMultiple(_path: string): Promise<Record<string, string>> {
        throw Error('Not implemented.');
      }
    }
    const provider = new TestProvider();
    defaultProviderHasSpy.mockReturnValue(true);
    defaultProviderGetSpy.mockReturnValue(provider);

    // Act
    const value = await get_secret('my-parameter');

    // Assess
    expect(value).toEqual('foo');
  
  });

});