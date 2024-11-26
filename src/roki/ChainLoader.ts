import { DefaultLoadingManager, LoadingManager } from 'three';
import { Chain } from './Chain.js';
import { ZTKParser } from '../zeda/ZTKParser.js';
import { FileLoader } from '../util/FileLoader.js';

export class ChainLoader extends FileLoader<Chain, ZTKParser> {
  constructor(manager?: LoadingManager) {
    super(manager ?? DefaultLoadingManager, new ZTKParser());
  }

  generateInstance(parser: ZTKParser): Chain {
    const chain = new Chain();
    chain.fromZTK(parser);
    chain.transformToThree();
    return chain;
  }
}
