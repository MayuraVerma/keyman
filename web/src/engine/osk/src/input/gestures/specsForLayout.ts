import {
  gestures,
  GestureModelDefs,
  InputSample
} from '@keymanapp/gesture-recognizer';

import {
  deepCopy
} from '@keymanapp/keyboard-processor';
import OSKLayerGroup from '../../keyboard-layout/oskLayerGroup.js';

import { type KeyElement } from '../../keyElement.js';

import specs = gestures.specs;

/**
 * Defines the set of gestures appropriate for use with the specified Keyman keyboard.
 * @param keyboard
 * @returns
 */
export function gestureSetForLayout(layerGroup: OSKLayerGroup): GestureModelDefs<KeyElement> {
  const layout = layerGroup.spec;

  // To be used among the `allowsInitialState` contact-model specifications as needed.
  const gestureKeyFilter = (key: KeyElement, gestureId: string) => {
    const keySpec = key.key.spec;
    switch(gestureId) {
      case 'special-key-start':
        return ['K_LOPT', 'K_ROPT', 'K_BKSP'].indexOf(keySpec.baseKeyID) != -1;
      case 'longpress':
        return !!keySpec.sk;
      case 'multitap':
        if(layout.hasMultitaps) {
          return !!keySpec.multitap;
        } else if(layout.formFactor != 'desktop') {
          // maintain our special caps-shifting?
          // if(keySpec.baseKeyID == 'K_SHIFT') {

          // } else {
          return false;
          // }
        }
      case 'flick':
        // This is a gesture-start check; there won't yet be any directional info available.
        return !!keySpec.flick;
      default:
        return true;
    }
  };

  const simpleTapModel: GestureModel = deepCopy(layout.hasFlicks ? SimpleTapModel : SimpleTapModelWithReset);
  const longpressModel: GestureModel = deepCopy(layout.hasFlicks ? BasicLongpressModel : LongpressModelWithShortcut);

  // #region Functions for implementing and/or extending path initial-state checks
  function withKeySpecFiltering(model: GestureModel, contactIndices: number | number[]) {
    // Creates deep copies of the model specifications that are safe to customize to the
    // keyboard layout.
    model = deepCopy(model);
    const modelId = model.id;

    if(typeof contactIndices == 'number') {
      contactIndices = [contactIndices];
    }

    model.contacts.forEach((contact, index) => {
      if((contactIndices as number[]).indexOf(index) != -1) {
        const baseInitialStateCheck = contact.model.allowsInitialState ?? (() => true);

        contact.model = {
          ...contact.model,
          allowsInitialState: (sample, ancestorSample, key) => {
            return baseInitialStateCheck(sample, ancestorSample, key) && gestureKeyFilter(key, modelId);
          }
        };
      }
    });

    return model;
  }

  function withLayerChangeItemFix(model: GestureModel, contactIndices: number | number[]) {
    // Creates deep copies of the model specifications that are safe to customize to the
    // keyboard layout.
    model = deepCopy(model);

    if(typeof contactIndices == 'number') {
      contactIndices = [contactIndices];
    }

    model.contacts.forEach((contact, index) => {
      if((contactIndices as number[]).indexOf(index) != -1) {
        const baseInitialStateCheck = contact.model.allowsInitialState ?? (() => true);

        contact.model = {
          ...contact.model,
          // And now for the true purpose of the method.
          allowsInitialState: (sample, ancestorSample, baseKey) => {
            // By default, the state token is set to whatever the current layer is for a source.
            //
            // So, if the first tap of a key swaps layers, the second tap will be on the wrong layer and
            // thus have a different state token.  This is the perfect place to detect and correct that.
            if(ancestorSample.stateToken != sample.stateToken) {
              sample.stateToken = ancestorSample.stateToken;

              // Specialized item lookup is required here for proper 'correction' - we want the key
              // corresponding to our original layer, not the new layer here.  Now that we've identified
              // the original OSK layer (state) for the gesture, we can find the best matching key
              // from said layer instead of the current layer.
              //
              // Matters significantly for multitaps if and when they include layer-switching specs.
              sample.item = layerGroup.findNearestKey(sample);
            }

            return baseInitialStateCheck(sample, ancestorSample, baseKey);
          }
        };
      }
    });

    return model;
  }
  // #endregion

  const gestureModels = [
    withKeySpecFiltering(longpressModel, 0),
    withLayerChangeItemFix(withKeySpecFiltering(MultitapModel, 0), 0),
    simpleTapModel,
    withKeySpecFiltering(SpecialKeyStartModel, 0),
    SpecialKeyEndModel,
    SubkeySelectModel,
    withKeySpecFiltering(ModipressStartModel, 0),
    ModipressEndModel
  ];

  const defaultSet = [
    BasicLongpressModel.id, SimpleTapModel.id, ModipressStartModel.id, SpecialKeyStartModel.id
  ];

  if(layout.hasFlicks) {
    // TODO:
    // gestureModels.push // flick-start
    // gestureModels.push // flick-end

    // defaultSet.push('flick-start');
  }

  return {
    gestures: gestureModels,
    sets: {
      default: defaultSet,
      modipress: defaultSet.filter((entry) => entry != ModipressStartModel.id), // no nested modipressing
      none: []
    }
  }
}

// #region Definition of models for paths comprising gesture-stage models

type ContactModel = specs.ContactModel<KeyElement>;

export const InstantContactRejectionModel: ContactModel = {
  itemPriority: 0,
  pathResolutionAction: 'reject',
  pathModel: {
    evaluate: (path) => 'resolve'
  }
}

export const InstantContactResolutionModel: ContactModel = {
  itemPriority: 0,
  pathResolutionAction: 'resolve',
  pathModel: {
    evaluate: (path) => 'resolve'
  }
}

export const LongpressDistanceThreshold = 10;
export const BasicLongpressContactModel: ContactModel = {
  itemChangeAction: 'reject',
  itemPriority: 0,
  pathResolutionAction: 'resolve',
  timer: {
    duration: 500,
    expectedResult: true
  },
  pathModel: {
    evaluate: (path) => {
      const stats = path.stats;
      if(stats.rawDistance > LongpressDistanceThreshold) {
        return 'reject';
      }

      if(path.isComplete) {
        return 'reject';
      }
    }
  }
};

export const LongpressFlickDistanceThreshold = 6;
export const LongpressContactModelWithShortcut: ContactModel = {
  ...BasicLongpressContactModel,
  pathModel: {
    evaluate: (path) => {
      const stats = path.stats;

      // Adds up-flick support!
      if(stats.rawDistance > LongpressFlickDistanceThreshold && stats.cardinalDirection == 'n') {
        return 'resolve';
      }

      return BasicLongpressContactModel.pathModel.evaluate(path);
    }
  }
}

export const ModipressContactStartModel: ContactModel = {
  itemPriority: -1,
  pathResolutionAction: 'resolve',
  pathModel: {
    // Consideration of whether the underlying item supports the corresponding
    // gesture will be handled elsewhere.
    evaluate: (path) => 'resolve'
  }
}

export const ModipressContactEndModel: ContactModel = {
  itemPriority: -1,
  itemChangeAction: 'resolve',
  pathResolutionAction: 'resolve',
  pathModel: {
    evaluate: (path) => {
      if(path.isComplete) {
        return 'resolve';
      }
    }
  }
}

export const SimpleTapContactModel: ContactModel = {
  itemPriority: 0,
  itemChangeAction: 'reject',
  pathResolutionAction: 'resolve',
  pathModel: {
    evaluate: (path) => {
      if(path.isComplete && !path.wasCancelled) {
        return 'resolve';
      }
    }
  }
}

export const SubkeySelectContactModel: ContactModel = {
  itemPriority: 0,
  pathResolutionAction: 'resolve',
  pathModel: {
    evaluate: (path) => {
      if(path.isComplete && !path.wasCancelled) {
        return 'resolve';
      }
    }
  }
}
// #endregion

// #region Gesture-stage model definitions
type GestureModel = specs.GestureModel<KeyElement>;

// TODO:  customization of the gesture models depending upon properties of the keyboard.
// - has flicks?  no longpress shortcut, also no longpress reset(?)
// - modipress:  keyboard-specific modifier keys - which may require inspection of a
//   key's properties.

export const SpecialKeyStartModel: GestureModel = {
  id: 'special-key-start',
  resolutionPriority: 0,
  contacts : [
    {
      model: {
        ...InstantContactResolutionModel,
        allowsInitialState: (incoming, dummy, baseItem) => {
          // TODO:  needs better abstraction, probably.

          // But, to get started... we can just use a simple hardcoded approach.
          const modifierKeyIds = ['K_LOPT', 'K_ROPT', 'K_BKSP'];
          for(const modKeyId of modifierKeyIds) {
            if(baseItem.key.spec.id == modKeyId) {
              return true;
            }
          }

          return false;
        }
      },
      endOnResolve: false  // keyboard-selection longpress - would be nice to not need to lift the finger
                           // in app/browser form.
    }
  ],
  resolutionAction: {
    type: 'chain',
    next: 'special-key-end',
    item: 'current'
  }
}

export const SpecialKeyEndModel: GestureModel = {
  id: 'special-key-end',
  resolutionPriority: 0,
  contacts : [
    {
      model: {
        ...SimpleTapContactModel,
        itemChangeAction: 'resolve'
      },
      endOnResolve: true,
    }
  ],
  resolutionAction: {
    type: 'complete',
    item: 'none'
  }
}

/**
 * The flickless, roaming-touch-less version.
 */
export const BasicLongpressModel: GestureModel = {
  id: 'longpress',
  resolutionPriority: 0,
  contacts: [
    {
      model: {
        // Is the version without the up-flick shortcut.
        ...BasicLongpressContactModel,
        itemPriority: 1,
        pathInheritance: 'chop'
      },
      endOnResolve: false
    }, {
      model: InstantContactRejectionModel
    }
  ],
  resolutionAction: {
    type: 'chain',
    next: 'subkey-select',
    selectionMode: 'none',
    item: 'none'
  }
}

/**
 * For use when a layout doesn't have flicks; has the up-flick shortcut
 * and facilitates roaming-touch.
 */
export const LongpressModelWithShortcut: GestureModel = {
  ...BasicLongpressModel,

  id: 'longpress',
  resolutionPriority: 0,
  contacts: [
    {
      model: {
        // Is the version without the up-flick shortcut.
        ...LongpressContactModelWithShortcut,
        itemPriority: 1,
        pathInheritance: 'chop'
      },
      endOnResolve: false
    }, {
      model: InstantContactRejectionModel
    }
  ],
  resolutionAction: {
    type: 'chain',
    next: 'subkey-select',
    selectionMode: 'none',
    item: 'none'
  },

  /*
   * Note:  these actions make sense in a 'roaming-touch' context, but not when
   * flicks are also enabled.
   */
  rejectionActions: {
    item: {
      type: 'replace',
      replace: 'longpress'
    },
    path: {
      type: 'replace',
      replace: 'longpress'
    }
  }
}

export const MultitapModel: GestureModel = {
  id: 'multitap',
  resolutionPriority: 2,
  contacts: [
    {
      model: {
        ...SimpleTapContactModel,
        itemPriority: 1,
        pathInheritance: 'reject',
        allowsInitialState(incomingSample, comparisonSample, baseItem) {
          return incomingSample.item == baseItem;
        },
      },
      endOnResolve: true
    }, {
      model: InstantContactResolutionModel
    }
  ],
  sustainTimer: {
    duration: 500,
    expectedResult: false,
    baseItem: 'base'
  },
  resolutionAction: {
    type: 'chain',
    next: 'multitap',
    item: 'current'
  }
}

export const SimpleTapModel: GestureModel = {
  id: 'simple-tap',
  resolutionPriority: 1,
  contacts: [
    {
      model: {
        ...SimpleTapContactModel,
        pathInheritance: 'chop',
        itemPriority: 1
      },
      endOnResolve: true
    }, {
      model: InstantContactResolutionModel,
      resetOnResolve: true
    }
  ],
  resolutionAction: {
    type: 'chain',
    next: 'multitap',
    item: 'current'
  }
}

export const SimpleTapModelWithReset: GestureModel = {
  ...SimpleTapModel,
  rejectionActions: {
    item: {
      type: 'replace',
      replace: 'simple-tap'
    }
  }
}

export const SubkeySelectModel: GestureModel = {
  id: 'subkey-select',
  resolutionPriority: 0,
  contacts: [
    {
      model: {
        ...SubkeySelectContactModel,
        pathInheritance: 'full',
        itemPriority: 1
      },
      endOnResolve: true,
      endOnReject: true
    }, {
      // A second touch while selecting a subkey will trigger instant cancellation
      // of subkey mode.  (With this setting in place, anyway.)
      //
      // Might not be ideal for actual production... but it does have benefits for
      // unit testing the gesture-matching engine.
      model: InstantContactRejectionModel
    }
  ],
  resolutionAction: {
    type: 'complete',
    item: 'current'
  },
  sustainWhenNested: true
}

export const ModipressStartModel: GestureModel = {
  id: 'modipress-start',
  resolutionPriority: 5,
  contacts: [
    {
      model: {
        ...ModipressContactStartModel,
        allowsInitialState(incomingSample, comparisonSample, baseItem) {
          // TODO:  needs better abstraction, probably.

          // But, to get started... we can just use a simple hardcoded approach.
          const modifierKeyIds = ['K_SHIFT', 'K_ALT', 'K_CTRL'];
          for(const modKeyId of modifierKeyIds) {
            if(baseItem.key.spec.id == modKeyId) {
              return true;
            }
          }

          return false;
        },
        itemChangeAction: 'reject',
        itemPriority: 1
      }
    }
  ],
  resolutionAction: {
    type: 'chain',
    next: 'modipress-end',
    selectionMode: 'modipress',
    item: 'current' // return the modifier key ID so that we know to shift to it!
  }
}

export const ModipressEndModel: GestureModel = {
  id: 'modipress-end',
  resolutionPriority: 5,
  contacts: [
    {
      model: {
        ...ModipressContactEndModel,
        itemChangeAction: 'reject'
      }
    }
  ],
  resolutionAction: {
    type: 'complete',
    item: 'none'
  }
}
// #endregion