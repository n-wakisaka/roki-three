import * as fs from 'fs'
import { LoadingManager, MathUtils } from 'three'
import { Sequence } from '../../src/zm/Sequence.js'
import { SequenceLoader } from '../../src/zm/SequenceLoader.js'

describe('SequenceLoader', () => {
  beforeEach(async () => {
    const data = fs.readFileSync('./test/zm/seq.zvs', 'utf-8')
    vi.spyOn(global, 'fetch').mockImplementation(async () => new Response(data))
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('load', () => {
    const manager = new LoadingManager()
    const loader = new SequenceLoader(manager)

    let seq: Sequence | undefined
    loader.load('seq.zvs', (s) => {
      console.log('load')
      seq = s
      expect(seq).toBeDefined()
      // console.log(seq);
    })

    manager.onError = (url) => {
      console.log(`manager error: ${url}`)
    }

    manager.onLoad = () => {
      console.log('manager load')
      expect(seq).toBeDefined()
    }
  })
})
