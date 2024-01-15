import { FileParser } from '../util/FileParser.js';
import { Node, LinkedList } from '../util/LinkedList.js';

type KeyField = {
  key: string;
  values: LinkedList<string>;
};

type TagField = {
  tag: string;
  keyValues: LinkedList<KeyField>;
};

export class ZTKParser extends FileParser {
  #data = new LinkedList<TagField>();
  #cur: Cursor | null = null;

  countTag(tag: string): number {
    return this.#data.count((data) => data.tag === tag);
  }

  countKey(key: string): number {
    if (this.#cur == null) return 0;
    const cur = this.#cur.clone();
    cur.rewindKey();
    let count = 0;
    while (cur.key != null) {
      if (cur.key == key) count++;
      cur.nextKey();
    }
    return count;
  }

  countKeyAll(key: string): number {
    let count = 0;
    this.#data.forEach((node, _index) => {
      count += node.data.keyValues.count((data) => data.key === key);
    });
    return count;
  }

  parseData(tokens: Array<string>): boolean {
    let i: number = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      if (token === ZTKParser.TAG_BEGIN_IDENT) {
        // tag
        if (i + 2 < tokens.length && tokens[i + 2] !== ZTKParser.TAG_END_IDENT) {
          // invalid
          return false;
        }
        const tag = tokens[i + 1];
        this.#data.insertTail({
          tag: tag,
          keyValues: new LinkedList<KeyField>(),
        });
        i += 2;
      } else if (token === ZTKParser.TAG_END_IDENT) {
        // invalid
        return false;
      } else {
        if (!this.#data.tail) {
          this.#data.insertTail({
            tag: '',
            keyValues: new LinkedList<KeyField>(),
          });
        }
        const tagNode = this.#data.tail;
        if (i + 1 < tokens.length && tokens[i + 1] === ZTKParser.KEY_IDENT) {
          // key
          tagNode?.data.keyValues.insertTail({
            key: token,
            values: new LinkedList<string>(),
          });
          i += 1;
        } else {
          if (!tagNode?.data.keyValues.tail) {
            tagNode?.data.keyValues.insertTail({
              key: '',
              values: new LinkedList<string>(),
            });
          }
          const keyNode = tagNode?.data.keyValues.tail;
          if (token !== ZTKParser.KEY_IDENT) {
            // value
            keyNode?.data.values.insertTail(token);
          }
        }
      }
      i += 1;
    }

    if (this.#data.head) {
      this.#cur = new Cursor(this.#data.head);
    }
    return true;
  }

  get cursor(): Cursor | null {
    return this.#cur;
  }

  rewind(): void {
    this.#cur?.rewindTag();
  }

  getValue = (): string | undefined => {
    const val = this.cursor?.value;
    this.cursor?.nextValue();
    return val;
  };

  getNumber = (): number => {
    const num = Number(this.cursor?.value);
    this.cursor?.nextValue();
    return Number.isNaN(num) ? 0 : num;
  };

  getNumbers = (n: number): Array<number> => {
    const array = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      array[i] = this.getNumber();
    }
    return array;
  };

  private evaluate<T>(
    evalPrp: EvalPrp<T>,
    obj: T,
    getKey: (cur: Cursor) => string | undefined,
    nextKey: (cur: Cursor) => void,
    cursor: Cursor,
  ): void {
    const counter: { [name: string]: number } = {};
    Object.keys(evalPrp).forEach((key) => (counter[key] = 0));

    let value = getKey(cursor);
    while (value !== undefined) {
      if (value in evalPrp) {
        const prp = evalPrp[value];
        if (counter[value] < prp.num) {
          prp.evaluator(this, obj, counter[value]);
          counter[value]++;
        }
      }
      nextKey(cursor);
      value = getKey(cursor);
    }
  }

  evaluateTag<T>(evalPrp: EvalPrp<T>, obj: T, cursor?: Cursor): void {
    const cur = cursor ?? this.cursor;
    if (!cur) return;
    cur.rewindTag();
    this.evaluate(
      evalPrp,
      obj,
      (cur) => cur.tag,
      (cur) => cur.nextTag(),
      cur,
    );
  }

  evaluateKey<T>(evalPrp: EvalPrp<T>, obj: T, cursor?: Cursor): void {
    const cur = cursor ?? this.cursor;
    if (!cur) return;
    cur.rewindKey();
    this.evaluate(
      evalPrp,
      obj,
      (cur) => cur.key,
      (cur) => cur.nextKey(),
      cur,
    );
  }
}

type EvalPrp<T> = {
  [name: string]: {
    evaluator: (parser: ZTKParser, obj: T, index: number) => void;
    num: number;
  };
};

export class Cursor {
  #rootTag: Node<TagField>;
  #currentTag: Node<TagField> | null = null;
  #currentKey: Node<KeyField> | null = null;
  #currentValue: Node<string> | null = null;

  constructor(root: Node<TagField>) {
    this.#rootTag = root;
    this.rewindTag();
  }

  get tag(): string | undefined {
    return this.#currentTag?.data.tag;
  }
  get key(): string | undefined {
    return this.#currentKey?.data.key;
  }
  get value(): string | undefined {
    return this.#currentValue?.data;
  }
  get valueList(): LinkedList<string> | undefined {
    return this.#currentKey?.data.values;
  }

  clone(): Cursor {
    const cur = new Cursor(this.#rootTag);
    cur.#currentTag = this.#currentTag;
    cur.#currentKey = this.#currentKey;
    cur.#currentValue = this.#currentValue;
    return cur;
  }

  rewindValue(): void {
    this.#currentValue = this.#currentKey ? this.#currentKey.data.values.head : null;
  }

  rewindKey(): void {
    this.#currentKey = this.#currentTag ? this.#currentTag.data.keyValues.head : null;
    this.rewindValue();
  }

  rewindTag(): void {
    this.#currentTag = this.#rootTag;
    this.rewindKey();
  }

  nextTag(): void {
    this.#currentTag = this.#currentTag ? this.#currentTag.next : null;
    this.rewindKey();
  }

  nextKey(): void {
    this.#currentKey = this.#currentKey ? this.#currentKey.next : null;
    this.rewindValue();
  }

  nextValue(): void {
    this.#currentValue = this.#currentValue ? this.#currentValue.next : null;
  }
}
