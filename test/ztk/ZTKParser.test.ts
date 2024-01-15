import { Vector3, Quaternion, Matrix4, Matrix3 } from 'three';
import { MathUtils } from 'three';
import { ZTKParser } from '../../src/zeda/ZTKParser.js';

describe('ZTKParser', () => {
  test('parse', () => {
    const parser = new ZTKParser();
    const data = `
            [tag1]
            key1: val1 val2 val3
            key2: val4, val5
            key3: { 1.0, 2.0, 3.0 }
            
            [tag2]
            key1 :val1 val2
            key2 : (val3 val4 val5)
            `;

    const isSucceeded = parser.parse(data);
    expect(isSucceeded).toBe(true);

    expect(parser.cursor?.tag).toBe('tag1');
    expect(parser.cursor?.key).toBe('key1');
    expect(parser.getValue()).toBe('val1');
    expect(parser.getValue()).toBe('val2');
    expect(parser.getValue()).toBe('val3');
    expect(parser.getValue()).toBe(undefined);
    parser.cursor?.nextKey();
    expect(parser.cursor?.key).toBe('key2');
    expect(parser.getValue()).toBe('val4');
    expect(parser.getValue()).toBe('val5');
    expect(parser.getValue()).toBe(undefined);
    parser.cursor?.nextKey();
    expect(parser.cursor?.key).toBe('key3');
    expect(parser.getValue()).toBeCloseTo(1.0);
    expect(parser.getValue()).toBeCloseTo(2.0);
    expect(parser.getValue()).toBeCloseTo(3.0);
    expect(parser.getValue()).toBe(undefined);
    parser.cursor?.nextKey();
    expect(parser.cursor?.key).toBe(undefined);

    parser.cursor?.nextTag();
    expect(parser.cursor?.tag).toBe('tag2');
    expect(parser.cursor?.key).toBe('key1');
    expect(parser.getValue()).toBe('val1');
    expect(parser.getValue()).toBe('val2');
    expect(parser.getValue()).toBe(undefined);
    parser.cursor?.nextKey();
    expect(parser.cursor?.key).toBe('key2');
    expect(parser.getValue()).toBe('val3');
    expect(parser.getValue()).toBe('val4');
    expect(parser.getValue()).toBe('val5');
    expect(parser.getValue()).toBe(undefined);
    parser.cursor?.nextKey();
    expect(parser.cursor?.key).toBe(undefined);
  });

  test('parse_invalid_tag', () => {
    const parser = new ZTKParser();
    const data = `
            [tag1
            key1: val1 val2 val3
            `;

    const isSucceeded = parser.parse(data);
    expect(isSucceeded).toBe(false);
  });

  test('parse_no_tag', () => {
    const parser = new ZTKParser();
    const data = `
            key1: val1 val2 val3
            key2: val4, val5
            `;

    const isSucceeded = parser.parse(data);
    expect(isSucceeded).toBe(true);

    expect(parser.cursor?.tag).toBe('');
    expect(parser.cursor?.key).toBe('key1');
    expect(parser.getValue()).toBe('val1');
    expect(parser.getValue()).toBe('val2');
    expect(parser.getValue()).toBe('val3');
    expect(parser.getValue()).toBe(undefined);
    parser.cursor?.nextKey();
    expect(parser.cursor?.key).toBe('key2');
    expect(parser.getValue()).toBe('val4');
    expect(parser.getValue()).toBe('val5');
    expect(parser.getValue()).toBe(undefined);
    parser.cursor?.nextKey();
    expect(parser.cursor?.key).toBe(undefined);
  });

  test('parse_no_tag_no_key', () => {
    const parser = new ZTKParser();
    const data = `
            val1 val2 val3
            key2: val4, val5
            `;

    const isSucceeded = parser.parse(data);
    expect(isSucceeded).toBe(true);

    expect(parser.cursor?.tag).toBe('');
    expect(parser.cursor?.key).toBe('');
    expect(parser.getValue()).toBe('val1');
    expect(parser.getValue()).toBe('val2');
    expect(parser.getValue()).toBe('val3');
    expect(parser.getValue()).toBe(undefined);
    parser.cursor?.nextKey();
    expect(parser.cursor?.key).toBe('key2');
    expect(parser.getValue()).toBe('val4');
    expect(parser.getValue()).toBe('val5');
    expect(parser.getValue()).toBe(undefined);
    parser.cursor?.nextKey();
    expect(parser.cursor?.key).toBe(undefined);
  });

  test('parse_no_tag_no_key2', () => {
    const parser = new ZTKParser();
    const data = `
            : val1 val2 val3
            key2: val4, val5
            `;

    const isSucceeded = parser.parse(data);
    expect(isSucceeded).toBe(true);

    expect(parser.cursor?.tag).toBe('');
    expect(parser.cursor?.key).toBe('');
    expect(parser.getValue()).toBe('val1');
    expect(parser.getValue()).toBe('val2');
    expect(parser.getValue()).toBe('val3');
    expect(parser.getValue()).toBe(undefined);
    parser.cursor?.nextKey();
    expect(parser.cursor?.key).toBe('key2');
    expect(parser.getValue()).toBe('val4');
    expect(parser.getValue()).toBe('val5');
    expect(parser.getValue()).toBe(undefined);
    parser.cursor?.nextKey();
    expect(parser.cursor?.key).toBe(undefined);
  });

  test('evaluation', () => {
    const parser = new ZTKParser();
    const data = `
            [tag1]
            key1: val1 val2 val3
            key2: val4, val5
            key3: { 1.0, 2.0, 3.0 }
            
            [tag2]
            key1 :val1 val2
            key2 : (val3 val4 val5)
            `;

    const isSucceeded = parser.parse(data);
    expect(isSucceeded).toBe(true);

    const counter = {
      tag1: { key1: 0, key2: 0, key3: 0 },
      tag2: { key1: 0, key2: 0 },
    };
    parser.evaluateTag(
      {
        tag1: {
          evaluator: (parser: ZTKParser, obj: null, index: number): void => {
            parser.evaluateKey(
              {
                key1: {
                  evaluator: (parser: ZTKParser, obj: null, index: number): void => {
                    expect(parser.getValue()).toBe('val1');
                    expect(parser.getValue()).toBe('val2');
                    expect(parser.getValue()).toBe('val3');
                    counter['tag1']['key1']++;
                  },
                  num: 1,
                },
                key2: {
                  evaluator: (parser: ZTKParser, obj: null, index: number): void => {
                    expect(parser.getValue()).toBe('val4');
                    expect(parser.getValue()).toBe('val5');
                    counter['tag1']['key2']++;
                  },
                  num: 1,
                },
                key3: {
                  evaluator: (parser: ZTKParser, obj: null, index: number): void => {
                    expect(parser.getValue()).toBeCloseTo(1.0);
                    expect(parser.getValue()).toBeCloseTo(2.0);
                    expect(parser.getValue()).toBeCloseTo(3.0);
                    counter['tag1']['key3']++;
                  },
                  num: 1,
                },
              },
              null,
            );
          },
          num: 1,
        },
        tag2: {
          evaluator: (parser: ZTKParser, obj: null, index: number): void => {
            parser.evaluateKey(
              {
                key1: {
                  evaluator: (parser: ZTKParser, obj: null, index: number): void => {
                    expect(parser.getValue()).toBe('val1');
                    expect(parser.getValue()).toBe('val2');
                    counter['tag2']['key1']++;
                  },
                  num: 1,
                },
                key2: {
                  evaluator: (parser: ZTKParser, obj: null, index: number): void => {
                    expect(parser.getValue()).toBe('val3');
                    expect(parser.getValue()).toBe('val4');
                    expect(parser.getValue()).toBe('val5');
                    counter['tag2']['key2']++;
                  },
                  num: 1,
                },
              },
              null,
            );
          },
          num: 1,
        },
      },
      null,
    );
    expect(counter['tag1']['key1']).toBe(1);
    expect(counter['tag1']['key2']).toBe(1);
    expect(counter['tag1']['key3']).toBe(1);
    expect(counter['tag2']['key1']).toBe(1);
    expect(counter['tag2']['key2']).toBe(1);
  });
});
