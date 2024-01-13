import { DefaultLoadingManager, LoadingManager } from 'three'
import { Sequence } from './Sequence.js'
import { ZVSParser } from './ZVSParser.js'
import { FileLoader } from '../util/FileLoader.js'

export class SequenceLoader extends FileLoader<Sequence, ZVSParser> {
  constructor(manager?: LoadingManager) {
    super(manager ?? DefaultLoadingManager, new ZVSParser())
  }

  generateInstance(parser: ZVSParser): Sequence {
    const seq = new Sequence()
    seq.fromZVS(parser)
    return seq
  }
}
