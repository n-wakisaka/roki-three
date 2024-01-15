import * as fs from 'fs';
import { LoadingManager, MathUtils } from 'three';
import { Chain } from '../../src/roki/Chain.js';
import { ChainLoader } from '../../src/roki/ChainLoader.js';

describe('ChainLoader', () => {
  beforeEach(async () => {
    const data = fs.readFileSync('./test/roki/arm_2DoF.ztk', 'utf-8');
    vi.spyOn(global, 'fetch').mockImplementation(async () => new Response(data));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('load', () => {
    const manager = new LoadingManager();
    const loader = new ChainLoader(manager);

    let chain: Chain | undefined;
    loader.load('arm_2DoF.ztk', (c) => {
      console.log('load');
      chain = c;
      expect(chain).toBeDefined();
      // console.log(chain);
    });

    manager.onError = (url) => {
      console.log(`manager error: ${url}`);
    };

    manager.onLoad = () => {
      console.log('manager load');
      expect(chain).toBeDefined();
      chain?.FK();
    };
  });
});
