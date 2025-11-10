export interface CustomMapObserver<K, V, T> {
  notify: (map: CustomMap<K, V, T>) => void;
}

export type CustomMapper<V, T> = (value: V) => T;

export default class CustomMap<K, V, T = V> extends Map<K, V> {
  #observer?: CustomMapObserver<K, V, T>;
  #customMapper?: CustomMapper<V, T>;

  constructor({
    observer,
    customMapper,
  }: {
    observer?: CustomMapObserver<K, V, T>;
    customMapper?: CustomMapper<V, T>;
  }) {
    super();
    this.#observer = observer;
    this.#customMapper = customMapper;
  }

  *mappedValues(): IterableIterator<T> {
    for (const value of super.values()) {
      yield this.#customMapper ? this.#customMapper(value) : (value as unknown as T);
    }
  }

  override set(key: K, value: V): this {
    const result = super.set(key, value);
    this.#observer?.notify(this);
    return result;
  }

  override delete(key: K): boolean {
    const result = super.delete(key);
    this.#observer?.notify(this);
    return result;
  }
}
