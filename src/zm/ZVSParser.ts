import { LinkedList } from '../util/LinkedList.js'
import { FileParser } from '../util/FileParser.js'
import { SequenceData } from './Sequence.js'

export class ZVSParser extends FileParser {
  #data = new LinkedList<SequenceData>()

  get data(): LinkedList<SequenceData> {
    return this.#data
  }

  parseData(tokens: string[]): boolean {
    let i: number = 0
    const array = tokens.map(Number)
    if (array.some((n) => isNaN(n))) return false

    while (i < array.length) {
      const dt = array[i]
      const size = array[i + 1]
      if (!Number.isInteger(size)) return false
      const value = array.slice(i + 2, i + 2 + size)
      this.#data.insertTail({
        dt: dt,
        value: value,
      })
      i += 2 + size
    }
    return true
  }
}
