import { Node, LinkedList } from '../util/LinkedList.js'
import { ZVSParser } from './ZVSParser.js'

export type SequenceData = {
  dt: number
  value: Array<number>
}

export class Sequence {
  static readonly EPSILON = 1e-8

  #data = new LinkedList<SequenceData>()
  #current: Node<SequenceData> | null = null
  #time: number = 0

  get current(): Node<SequenceData> | null {
    return this.current
  }
  get data(): SequenceData | undefined {
    return this.#current?.data
  }
  get time(): number {
    return this.#time
  }

  get nextData(): SequenceData | undefined {
    return this.#current?.next?.data
  }
  get prevData(): SequenceData | undefined {
    return this.#current?.prev?.data
  }
  get array(): Array<SequenceData> {
    return this.#data.array()
  }

  currentIsStart(): boolean {
    return this.#current?.prev === null
  }
  currentIsEnd(): boolean {
    return this.#current?.next === null
  }

  rewind(): void {
    this.#current = this.#data.head
    this.#time = this.#current?.data.dt ?? 0
  }

  next(): boolean {
    if (this.#current === null) return true
    if (this.#current.next === null) {
      // console.debug('Sequence: last');
      return false
    }
    this.#current = this.#current.next
    this.#time += this.#current.data.dt
    return true
  }

  prev(): boolean {
    if (this.#current === null) return true
    if (this.#current.prev === null) {
      // console.debug('Sequence: first');
      return false
    }
    this.#time -= this.#current.data.dt
    this.#current = this.#current.prev
    return true
  }

  jump(step: number): void {
    if (step < 0) return
    this.rewind()
    for (let i = 0; i < step; i++) {
      if (!this.next()) break
    }
  }

  jumpTime(time: number): void {
    if (time < Sequence.EPSILON) return
    this.jumpElapsedTime(time - this.#time)
  }

  jumpElapsedTime(elapsedTime: number): void {
    if (Math.abs(elapsedTime) < Sequence.EPSILON) return
    if (this.#time + elapsedTime < Sequence.EPSILON) {
      this.rewind()
      return
    }
    if (elapsedTime > 0) {
      while (elapsedTime > Sequence.EPSILON) {
        if (!this.next()) break
        elapsedTime -= this.#current?.data.dt ?? 0
      }
    } else {
      while (elapsedTime < -Sequence.EPSILON) {
        elapsedTime += this.#current?.data.dt ?? 0
        if (!this.prev()) break
      }
    }
  }

  fromZVS(parser: ZVSParser) {
    this.#data = parser.data // move (not copy)
    this.rewind()
  }
}
