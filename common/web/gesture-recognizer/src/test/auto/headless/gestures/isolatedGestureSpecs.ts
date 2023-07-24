import { gestures } from '@keymanapp/gesture-recognizer';
import * as specs from './isolatedPathSpecs.js';
import specTypeDefs = gestures.specs;

type GestureModel = specTypeDefs.GestureModel<string>;

export const SimpleTapModel: GestureModel = {
  id: 'simple-tap',
  resolutionPriority: 0,
  itemPriority: 0,
  contacts: [
    {
      model: {
        ...specs.SimpleTapModel,
        itemPriority: 1
      },
      endOnResolve: true
    }, {
      model: specs.InstantResolutionModel
    }
  ],
  resolutionAction: {
    type: 'optional-chain',
    allowNext: 'multitap'
  }
}

export const MultitapModel: GestureModel = {
  id: 'multitap',
  resolutionPriority: 1,
  itemPriority: 1,
  contacts: [
    {
      model: {
        ...specs.SimpleTapModel,
        itemPriority: 1,
        pathInheritance: 'reject',
        allowsInitialState(incomingSample, comparisonSample, baseItem) {
          return incomingSample.item == baseItem;
        },
      },
      endOnResolve: true
    }, {
      model: specs.InstantResolutionModel
    }
  ],
  sustainTimer: {
    duration: 500,
    expectedResult: false,
    baseItem: 'base'
  },
  resolutionAction: {
    type: 'chain',
    next: 'multitap'
  }
}