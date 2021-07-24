interface GetOptionsInterface {
  maxAge?: number
  forceFetch?: boolean
  transform?: string
}

type GetMultipleOptionsInterface = {
  maxAge?: number
  forceFetch?: boolean
  transform?: string
  throwOnTransformError?: boolean
};

type ClassForBaseProvider = {
  get(name: string, options?: GetOptionsInterface): void | string | Record<string, unknown>
  getMultiple(path: string, options?: GetMultipleOptionsInterface): void | Record<string, unknown>
};

type ExpirableValue = {
  value: string | Record<string, unknown>
  ttl: number
};

export {
  GetOptionsInterface,
  GetMultipleOptionsInterface,
  ClassForBaseProvider,
  ExpirableValue
};