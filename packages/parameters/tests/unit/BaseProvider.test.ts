import { BaseProvider } from '../../src';

describe('Class: BaseProvider', () => {

  describe('Method: get', () => {

    test('when it raises an error, the error bubbles up', () => {

      // Prepare
      class TestProvider extends BaseProvider {
        public _get(_name: string): string {
          throw Error('Some error.');
        }

        public _getMultiple(_path: string): Record<string, string> {
          throw Error('Not implemented.');
        }
      }
      const provider = new TestProvider();

      // Act / Assess
      expect(() => {
        provider.get('my-parameter');
      }).toThrow('Some error.');
      expect.assertions(1);

    });

    test('when called with an unsupported transform, it throws', () => {
      // Prepare
      const mockData = JSON.stringify({ foo: 'bar' });
      class TestProvider extends BaseProvider {
        public _get(_name: string): string {
          return mockData;
        }

        public _getMultiple(_path: string): Record<string, string> {
          throw Error('Not implemented.');
        }
      }
      const provider = new TestProvider();

      // Act / Assess
      expect(() => {
        provider.get('my-parameter', { transform: 'foo' });
      }).toThrow('Invalid transform type foo.');
      expect.assertions(1);

    });

    test('when called and a cached value is available, it returns an the cached value', () => {
      // Prepare
      class TestProvider extends BaseProvider {
        public _get(_name: string): string {
          throw Error('Not implemented.');
        }
        
        public _getMultiple(_path: string): Record<string, string> {
          throw Error('Not implemented.');
        }
      }
      const provider = new TestProvider();
      const ttl = new Date();
      provider.store[[ 'my-parameter', undefined ].toString()] = { value: 'my-value', ttl: ttl.setSeconds(ttl.getSeconds() + 600) };
  
      // Act
      const values = provider.get('my-parameter');
  
      // Assess
      expect(values).toEqual('my-value');
    });

    test('when called with a json transform, and the value is a valid string representation of a JSON, it returns an object', () => {
      // Prepare
      const mockData = JSON.stringify({ foo: 'bar' });
      class TestProvider extends BaseProvider {
        public _get(_name: string): string {
          return mockData;
        }

        public _getMultiple(_path: string): Record<string, string> {
          throw Error('Not implemented.');
        }
      }
      const provider = new TestProvider();

      // Act
      const value = provider.get('my-parameter', { transform: 'json' });

      // Assess
      expect(typeof value).toBe('object');
      expect(value).toMatchObject({
        'foo': 'bar'
      });

    });

    test('when called with a json transform, and the value is NOT a valid string representation of a JSON, it throws', () => {
      // Prepare
      const mockData = `${JSON.stringify({ foo: 'bar' })}{`;
      class TestProvider extends BaseProvider {
        public _get(_name: string): string {
          return mockData;
        }

        public _getMultiple(_path: string): Record<string, string> {
          throw Error('Not implemented.');
        }
      }
      const provider = new TestProvider();

      // Act / Assess
      expect(() => {
        provider.get('my-parameter', { transform: 'json' });
      }).toThrow('SyntaxError: Unexpected token { in JSON at position 13');
      expect.assertions(1);

    });

    test('when called with a binary transform, and the value is a valid string representation of a binary, it returns the decoded value', () => {
      // Prepare
      const mockBinary = Buffer.from('my-value', 'utf-8').toString('base64');
      class TestProvider extends BaseProvider {
        public _get(_name: string): string {
          return mockBinary;
        }

        public _getMultiple(_path: string): Record<string, string> {
          throw Error('Not implemented.');
        }
      }
      const provider = new TestProvider();

      // Act
      const value = provider.get('my-parameter', { transform: 'binary' });

      // Assess
      expect(typeof value).toBe('string');
      expect(value).toEqual('my-value');

    });

    test('when called with a binary transform, and the value is NOT a valid string representation of a binary, it throws', () => {
      // Prepare
      const mockBinary = 'qw';
      class TestProvider extends BaseProvider {
        public _get(_name: string): string {
          return mockBinary;
        }

        public _getMultiple(_path: string): Record<string, string> {
          throw Error('Not implemented.');
        }
      }
      const provider = new TestProvider();

      // Act / Assess
      expect(() => {
        provider.get('my-parameter', { transform: 'binary' });
      }).toThrow('AssertionError [ERR_ASSERTION]: false == true');
      expect.assertions(1);

    });

  });

  describe('Method: getMultiple', () => {
    test('when it raises an error, the error bubbles up', () => {
      
      // Prepare
      class TestProvider extends BaseProvider {
        public _get(_name: string): string {
          throw Error('Not implemented.');
        }

        public _getMultiple(_path: string): Record<string, string> {
          throw Error('Some error.');
        }
      }
      const provider = new TestProvider();

      // Act / Assess
      expect(() => {
        provider.getMultiple('my-parameter');
      }).toThrow('Some error.');
      expect.assertions(1);

    });

    test('when called with a json transform, and all the values are a valid string representation of a JSON, it returns an object with all the values', () => {
      // Prepare
      const mockData = JSON.stringify({ foo: 'bar' });
      class TestProvider extends BaseProvider {
        public _get(_name: string): string {
          throw Error('Not implemented.');
        }
        
        public _getMultiple(_path: string): Record<string, string> {
          return { 'A': mockData };
        }
      }
      const provider = new TestProvider();

      // Act
      const values = provider.getMultiple('my-path', { transform: 'json' });

      // Assess
      expect(typeof values).toBe('object');
      expect(values).toMatchObject({
        'A': {
          'foo': 'bar'
        }
      });

    });

    test('when called, it returns an object with the values', () => {
      // Prepare
      class TestProvider extends BaseProvider {
        public _get(_name: string): string {
          throw Error('Not implemented.');
        }
        
        public _getMultiple(_path: string): Record<string, string> {
          return { 'A': 'foo', 'B': 'bar' };
        }
      }
      const provider = new TestProvider();

      // Act
      const values = provider.getMultiple('my-path');

      // Assess
      expect(typeof values).toBe('object');
      expect(values).toMatchObject({
        'A': 'foo',
        'B': 'bar'
      });

    });

    test('when called with a json transform, and one of the values is NOT a valid string representation of a JSON, it returns an object with partial failures', () => {
      // Prepare
      const mockData = JSON.stringify({ foo: 'bar' });
      class TestProvider extends BaseProvider {
        public _get(_name: string): string {
          throw Error('Not implemented.');
        }
        
        public _getMultiple(_path: string): Record<string, string> {
          return { 'A': mockData, 'B': `${mockData}{` };
        }
      }
      const provider = new TestProvider();

      // Act
      const values = provider.getMultiple('my-path', { transform: 'json' });

      // Assess
      expect(typeof values).toBe('object');
      expect(values).toMatchObject({
        'A': {
          'foo': 'bar'
        },
        'B': undefined
      });

    });

    test('when called with a json transform and throwOnTransformError, and at least ONE the values is NOT a valid string representation of a JSON, it throws', () => {
      // Prepare
      const mockData = JSON.stringify({ foo: 'bar' });
      class TestProvider extends BaseProvider {
        public _get(_name: string): string {
          throw Error('Not implemented.');
        }
        
        public _getMultiple(_path: string): Record<string, string> {
          return { 'A': `${mockData}{` };
        }
      }
      const provider = new TestProvider();

      // Act / Assess
      expect(() => {
        provider.getMultiple('my-path', { transform: 'json', throwOnTransformError: true });
      }).toThrow('SyntaxError: Unexpected token { in JSON at position 13');
      expect.assertions(1);

    });

  });

  test('when called with a binary transform, and all the values are a valid string representation of a binary, it returns an object with all the values', () => {
    // Prepare
    const mockBinary = Buffer.from('my-value', 'utf-8').toString('base64');
    class TestProvider extends BaseProvider {
      public _get(_name: string): string {
        throw Error('Not implemented.');
      }
      
      public _getMultiple(_path: string): Record<string, string> {
        return { 'A': mockBinary };
      }
    }
    const provider = new TestProvider();

    // Act
    const values = provider.getMultiple('my-path', { transform: 'binary' });

    // Assess
    expect(typeof values).toBe('object');
    expect(values).toMatchObject({
      'A': 'my-value'
    });

  });

  test('when called with a binary transform, and one of the values is NOT a valid string representation of a binary, it returns an object with partial failures', () => {
    // Prepare
    const mockBinary = Buffer.from('my-value', 'utf-8').toString('base64');
    class TestProvider extends BaseProvider {
      public _get(_name: string): string {
        throw Error('Not implemented.');
      }
      
      public _getMultiple(_path: string): Record<string, string> {
        return { 'A': mockBinary, 'B': 'qw' };
      }
    }
    const provider = new TestProvider();

    // Act
    const values = provider.getMultiple('my-path', { transform: 'binary' });

    // Assess
    expect(typeof values).toBe('object');
    expect(values).toMatchObject({
      'A': 'my-value',
      'B': undefined
    });

  });

  test('when called with a binary transform and throwOnTransformError, and at least ONE the values is NOT a valid string representation of a binary, it throws', () => {
    // Prepare
    class TestProvider extends BaseProvider {
      public _get(_name: string): string {
        throw Error('Not implemented.');
      }
      
      public _getMultiple(_path: string): Record<string, string> {
        return { 'A': 'qw' };
      }
    }
    const provider = new TestProvider();

    // Act / Assess
    expect(() => {
      provider.getMultiple('my-path', { transform: 'binary', throwOnTransformError: true });
    }).toThrow('AssertionError [ERR_ASSERTION]: false == true');
    expect.assertions(1);

  });

  test('when called with auto transform and the key of the parameter ends with `.binary`, and all the values are a valid string representation of a binary, it returns an object with all the transformed values', () => {
    // Prepare
    const mockBinary = Buffer.from('my-value', 'utf-8').toString('base64');
    class TestProvider extends BaseProvider {
      public _get(_name: string): string {
        throw Error('Not implemented.');
      }
      
      public _getMultiple(_path: string): Record<string, string> {
        return { 'A.binary': mockBinary };
      }
    }
    const provider = new TestProvider();

    // Act
    const values = provider.getMultiple('my-path', { transform: 'auto' });

    // Assess
    expect(typeof values).toBe('object');
    expect(values).toMatchObject({
      'A.binary': 'my-value'
    });

  });

  test('when called with auto transform and the key of the parameter DOES NOT end with `.binary` or `.json`, it returns an object with all the values NOT transformed', () => {
    // Prepare
    const mockBinary = Buffer.from('my-value', 'utf-8').toString('base64');
    class TestProvider extends BaseProvider {
      public _get(_name: string): string {
        throw Error('Not implemented.');
      }
      
      public _getMultiple(_path: string): Record<string, string> {
        return { 'A.foo': mockBinary };
      }
    }
    const provider = new TestProvider();

    // Act
    const values = provider.getMultiple('my-path', { transform: 'auto' });

    // Assess
    expect(typeof values).toBe('object');
    expect(values).toMatchObject({
      'A.foo': mockBinary
    });

  });

  test('when called with a binary transform, and at least ONE the values is undefined, it returns an object with one of the values undefined', () => {
    // Prepare
    class TestProvider extends BaseProvider {
      public _get(_name: string): string {
        throw Error('Not implemented.');
      }
      
      public _getMultiple(_path: string): Record<string, string|undefined> {
        return { 'A': undefined };
      }
    }
    const provider = new TestProvider();

    // Act
    const values = provider.getMultiple('my-path', { transform: 'auto' });

    expect(typeof values).toBe('object');
    expect(values).toMatchObject({
      'A': undefined
    });

  });

  test('when called and values cached are available, it returns an object with the cached values', () => {
    // Prepare
    class TestProvider extends BaseProvider {
      public _get(_name: string): string {
        throw Error('Not implemented.');
      }
      
      public _getMultiple(_path: string): Record<string, string> {
        throw Error('Not implemented.');
      }
    }
    const provider = new TestProvider();
    const ttl = new Date();
    provider.store[[ 'my-path', undefined ].toString()] = { value: { 'A': 'my-value' }, ttl: ttl.setSeconds(ttl.getSeconds() + 600) };

    // Act
    const values = provider.getMultiple('my-path');

    // Assess
    expect(typeof values).toBe('object');
    expect(values).toMatchObject({
      'A': 'my-value',
    });
  });

  test('when called and values cached are expired, it returns an object with the remote values', () => {
    // Prepare
    class TestProvider extends BaseProvider {
      public _get(_name: string): string {
        throw Error('Not implemented.');
      }
      
      public _getMultiple(_path: string): Record<string, string> {
        return { 'A': 'my-value' };
      }
    }
    const provider = new TestProvider();
    const ttl = new Date();
    provider.store[[ 'my-path', undefined ].toString()] = { value: { 'B': 'my-other-value' }, ttl: ttl.setSeconds(ttl.getSeconds() - 600) };

    // Act
    const values = provider.getMultiple('my-path');

    // Assess
    expect(typeof values).toBe('object');
    expect(values).toMatchObject({
      'A': 'my-value',
    });
  });

});