import { LoadingManager } from 'three';
import { FileParser } from './FileParser.js';

export abstract class FileLoader<T, Parser extends FileParser> {
  #manager: LoadingManager;
  #parser: Parser;

  constructor(manager: LoadingManager, parser: Parser) {
    this.#manager = manager;
    this.#parser = parser;
  }

  abstract generateInstance(parser: Parser): T;

  loadAsync(url: string) {
    return new Promise((resolve, reject) => {
      this.load(url, resolve, undefined, reject);
    });
  }

  load(
    url: string,
    onLoad?: (obj: T) => void,
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    onProgress?: (value?: any) => void,
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    onError?: (reason?: any) => void,
  ): void {
    this.#manager.itemStart(url);

    fetch(url)
      .then((res) => {
        if (res.ok) {
          if (onProgress) onProgress();
          return res.text();
        } else {
          throw new Error(
            `FileLoader: Failed to fetch url ${url}, code ${res.status}: ${res.statusText}`,
          );
        }
      })
      .then((data) => {
        if (this.#parser.parse(data)) {
          const obj = this.generateInstance(this.#parser);
          if (onLoad) onLoad(obj);
          this.#manager.itemEnd(url);
        } else {
          throw new Error(`FileParser: Parse failed`);
        }
      })
      .catch((err) => {
        if (onError) {
          onError(err);
        } else {
          console.error(`Loader: Error loading file.`, err);
        }
        this.#manager.itemError(url);
        this.#manager.itemEnd(url);
      });
  }
}
