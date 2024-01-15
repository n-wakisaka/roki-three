import { Sequence, SequenceData } from '../../src/zm/Sequence.js';
import { ZVSParser } from '../../src/zm/ZVSParser.js';

describe('Sequence', () => {
  test('next-prev', () => {
    const parser = new ZVSParser();
    parser.parse(
      `
            0.1 3 0 0 0
            0.2 3 0 0 1
            0.3 3 0 1 2
            `,
    );
    const seq = new Sequence();
    seq.fromZVS(parser);
    expect(seq).toBeDefined();

    expect(seq.time).toBeCloseTo(0.1);
    expect(seq.data?.dt).toStrictEqual(0.1);
    expect(seq.data?.value).toStrictEqual([0, 0, 0]);
    seq.next();
    expect(seq.time).toBeCloseTo(0.3);
    expect(seq.data?.dt).toStrictEqual(0.2);
    expect(seq.data?.value).toStrictEqual([0, 0, 1]);
    seq.next();
    expect(seq.time).toBeCloseTo(0.6);
    expect(seq.data?.dt).toStrictEqual(0.3);
    expect(seq.data?.value).toStrictEqual([0, 1, 2]);
    seq.next();
    expect(seq.time).toBeCloseTo(0.6);
    expect(seq.data?.dt).toStrictEqual(0.3);
    expect(seq.data?.value).toStrictEqual([0, 1, 2]);

    seq.prev();
    expect(seq.time).toBeCloseTo(0.3);
    expect(seq.data?.dt).toStrictEqual(0.2);
    expect(seq.data?.value).toStrictEqual([0, 0, 1]);
    seq.prev();
    expect(seq.time).toBeCloseTo(0.1);
    expect(seq.data?.dt).toStrictEqual(0.1);
    expect(seq.data?.value).toStrictEqual([0, 0, 0]);
    seq.prev();
    expect(seq.time).toBeCloseTo(0.1);
    expect(seq.data?.dt).toStrictEqual(0.1);
    expect(seq.data?.value).toStrictEqual([0, 0, 0]);
  });

  test('jump', () => {
    const parser = new ZVSParser();
    parser.parse(
      `
            0.1 3 0 0 0
            0.1 3 0 0 1
            0.1 3 0 1 2
            `,
    );
    const seq = new Sequence();
    seq.fromZVS(parser);
    expect(seq).toBeDefined();

    seq.jump(1);
    expect(seq.time).toBeCloseTo(0.2);
    expect(seq.data?.dt).toStrictEqual(0.1);
    expect(seq.data?.value).toStrictEqual([0, 0, 1]);

    seq.jump(-1);
    expect(seq.time).toBeCloseTo(0.2);
    expect(seq.data?.dt).toStrictEqual(0.1);
    expect(seq.data?.value).toStrictEqual([0, 0, 1]);

    seq.jump(2);
    expect(seq.time).toBeCloseTo(0.3);
    expect(seq.data?.dt).toStrictEqual(0.1);
    expect(seq.data?.value).toStrictEqual([0, 1, 2]);
  });

  test('jumpTime', () => {
    const parser = new ZVSParser();
    parser.parse(
      `
            0.1 3 0 0 0
            0.1 3 0 0 1
            0.1 3 0 1 2
            `,
    );
    const seq = new Sequence();
    seq.fromZVS(parser);
    expect(seq).toBeDefined();

    seq.jumpTime(0.1);
    expect(seq.time).toBeCloseTo(0.1);
    expect(seq.data?.dt).toStrictEqual(0.1);
    expect(seq.data?.value).toStrictEqual([0, 0, 0]);

    seq.jumpTime(0.15);
    expect(seq.time).toBeCloseTo(0.2);
    expect(seq.data?.dt).toStrictEqual(0.1);
    expect(seq.data?.value).toStrictEqual([0, 0, 1]);

    seq.jumpTime(0.2);
    expect(seq.time).toBeCloseTo(0.2);
    expect(seq.data?.dt).toStrictEqual(0.1);
    expect(seq.data?.value).toStrictEqual([0, 0, 1]);

    seq.jumpTime(-1);
    expect(seq.time).toBeCloseTo(0.2);
    expect(seq.data?.dt).toStrictEqual(0.1);
    expect(seq.data?.value).toStrictEqual([0, 0, 1]);

    seq.jumpTime(0.3);
    expect(seq.time).toBeCloseTo(0.3);
    expect(seq.data?.dt).toStrictEqual(0.1);
    expect(seq.data?.value).toStrictEqual([0, 1, 2]);
  });

  test('jumpElapsedTime', () => {
    const parser = new ZVSParser();
    parser.parse(
      `
            0.1 3 0 0 0
            0.1 3 0 0 1
            0.1 3 0 1 2
            `,
    );
    const seq = new Sequence();
    seq.fromZVS(parser);
    expect(seq).toBeDefined();

    seq.jumpElapsedTime(0);
    expect(seq.time).toBeCloseTo(0.1);
    expect(seq.data?.dt).toStrictEqual(0.1);
    expect(seq.data?.value).toStrictEqual([0, 0, 0]);

    seq.jumpElapsedTime(0.1);
    expect(seq.time).toBeCloseTo(0.2);
    expect(seq.data?.dt).toStrictEqual(0.1);
    expect(seq.data?.value).toStrictEqual([0, 0, 1]);

    seq.jumpElapsedTime(0.1);
    expect(seq.time).toBeCloseTo(0.3);
    expect(seq.data?.dt).toStrictEqual(0.1);
    expect(seq.data?.value).toStrictEqual([0, 1, 2]);

    seq.jumpElapsedTime(-0.1);
    expect(seq.time).toBeCloseTo(0.2);
    expect(seq.data?.dt).toStrictEqual(0.1);
    expect(seq.data?.value).toStrictEqual([0, 0, 1]);

    seq.jumpElapsedTime(-0.1);
    expect(seq.time).toBeCloseTo(0.1);
    expect(seq.data?.dt).toStrictEqual(0.1);
    expect(seq.data?.value).toStrictEqual([0, 0, 0]);
  });
});
