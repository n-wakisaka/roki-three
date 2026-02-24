import { LoadingManager, Loader } from 'three';
import { FileParser } from './FileParser.js';

export abstract class FileLoader<T, Parser extends FileParser> extends Loader<T> {
  #parser: Parser;

  constructor(manager: LoadingManager, parser: Parser) {
    super(manager);
    this.#parser = parser;
  }

  abstract generateInstance(parser: Parser): T;

  load(
    url: string,
    onLoad?: (obj: T) => void,
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    onProgress?: (event: ProgressEvent) => void,
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    onError?: (reason: any) => void,
  ): void {
    this.manager.itemStart(url);

    fetch(url)
      .then((res) => {
        if (res.ok) {
          return res.text();
        } else {
          throw new Error(
            `FileLoader: Failed to fetch url ${url}, code ${res.status}: ${res.statusText}`,
          );
        }
      })
      .then((data) => {
        const obj = this.parse(data);
        if (onLoad) onLoad(obj);
        this.manager.itemEnd(url);
      })
      .catch((err) => {
        if (onError) {
          onError(err);
        } else {
          console.error(`Loader: Error loading file.`, err);
        }
        this.manager.itemError(url);
        this.manager.itemEnd(url);
      });
  }

  parse(data: string): T {
    if (this.#parser.parse(data)) {
      return this.generateInstance(this.#parser);
    } else {
      throw new Error(`FileParser: Parse failed`);
    }
  }
}
