import { strict as assert } from 'assert';
import { ClassForBaseProvider, ExpirableValue, GetMultipleOptionsInterface, GetOptionsInterface } from '../types';

const DEFAULT_MAX_AGE_SECS = 5;
const TRANSFORM_METHOD_JSON = 'json';
const TRANSFORM_METHOD_BINARY = 'binary';
const SUPPORTED_TRANSFORM_METHODS = [ TRANSFORM_METHOD_JSON, TRANSFORM_METHOD_BINARY ];
// These providers will be dynamically initialized on first use of the helper functions
const DEFAULT_PROVIDERS = {} as Record<string, unknown>;

class GetOptions implements GetOptionsInterface {
  public forceFetch: boolean = false;
  public maxAge: number = DEFAULT_MAX_AGE_SECS;
  public transform?: string;

  public constructor(options: GetOptionsInterface) {
    Object.assign(this, options);
  }
}

class GetMultipleOptions implements GetMultipleOptionsInterface {
  public forceFetch: boolean = false;
  public maxAge: number = DEFAULT_MAX_AGE_SECS;
  public throwOnTransformError?: boolean = false;
  public transform?: string;

  public constructor(options: GetMultipleOptionsInterface) {
    Object.assign(this, options);
  }
}

abstract class BaseProvider implements ClassForBaseProvider {
  public store: Record<string, ExpirableValue> = {};
  
  abstract _get(name: string): string;

  abstract _getMultiple(path: string): Record<string, string|undefined>;
  
  public get(name: string, options?: GetOptionsInterface): void | string | Record<string, unknown> {
    const configs = new GetOptions(options || {});
    const key = [ name, configs.transform ].toString();

    if (configs.forceFetch === false && this.hasNotExpired(key)) {
      return this.store[key]?.value;
    }

    let value;
    try {
      value = this._get(name);
    } catch (error) {
      throw Error(error);
    }

    if (configs.transform !== undefined) {
      value = transformValue(value, configs.transform);
    }

    if (value !== undefined) {
      const ttl = new Date();
      this.store[key] = {
        value: value,
        ttl: ttl.setSeconds(ttl.getSeconds() + configs.maxAge)
      };
    }

    return value;
  }

  public getMultiple(path: string, options?: GetMultipleOptionsInterface): void | Record<string, unknown> {
    const configs = new GetMultipleOptions(options || {});
    const key = [ path, configs.transform ].toString();

    if (configs.forceFetch === false && this.hasNotExpired(key)) {
      return this.store[key]?.value as Record<string, unknown>;
    }

    let values: Record<string, string | undefined> = {};
    try {
      values = this._getMultiple(path);
    } catch (error) {
      throw Error(error);
    }

    if (configs.transform !== undefined) {
      Object.keys(values).forEach(key => {
        // TODO: this feature is undocumented in Python and implemented only on getMultiple, check with the team
        const _transform = getTransformMethod(key, configs.transform);
        if (_transform === undefined) {
          return;
        }

        const valueToTransform = values[key];
        if (valueToTransform !== undefined) {
          values[key] = transformValue(valueToTransform, _transform, configs.throwOnTransformError);
        }
      });
    }

    if (Array.from(Object.keys(values)).length !== 0) {
      const ttl = new Date();
      this.store[key] = {
        value: path,
        ttl: ttl.setSeconds(ttl.getSeconds() + configs.maxAge)
      };
    }

    return values;
  }

  private hasNotExpired(key: string): boolean {
    if (!(key in this.store)) {
      return false;
    }

    return this.store[key].ttl > Date.now();
  }

}

const getTransformMethod = (key: string, transform?: string): string | undefined => { 
  if (transform !== 'auto') {
    return transform;
  }

  for (const idx in SUPPORTED_TRANSFORM_METHODS) {
    if (key.endsWith(`.${SUPPORTED_TRANSFORM_METHODS[idx]}`)) {
      return SUPPORTED_TRANSFORM_METHODS[idx];
    }
  }

  return undefined;
};

const transformValue = (value: string, transform: string, throwOnTransformError: boolean = true): string | undefined => {
  const normalizedTrasnform = transform.toLowerCase();
  if (SUPPORTED_TRANSFORM_METHODS.indexOf(normalizedTrasnform) == -1) {
    throw Error(`Invalid transform type ${normalizedTrasnform}.`);
  }
  
  try {
    if (normalizedTrasnform === TRANSFORM_METHOD_JSON) {
      return JSON.parse(value);
    } else if (normalizedTrasnform === TRANSFORM_METHOD_BINARY) {      
      const regex = '(?:[A-Za-z0-9+\\/]{4})*(?:[A-Za-z0-9+\\/]{2}==|[A-Za-z0-9+\/]{3}=)?';
      assert(new RegExp('^' + regex + '$', 'gi').test(value) === true);

      return Buffer.from(value, 'base64').toString('utf-8');
    }
  } catch (error) {
    if (throwOnTransformError) {
      throw Error(error);
    }
    
    return;
  }
};

export {
  BaseProvider,
  getTransformMethod,
  transformValue,
  DEFAULT_PROVIDERS
};