namespace Testing {
  /**
   * This class is designed to 'replay' a recorded InputSequence's DOM events to ensure
   * that the recognizer's DOM layer is working correctly.
   */
  export class InputSequenceSimulator {
    private controller: HostFixtureLayoutController;

    constructor(controller: HostFixtureLayoutController) {
      this.controller = controller;
    }

    getSampleClientPos(sample: JSONObject<com.keyman.osk.InputSample>): {clientX: number, clientY: number} {
      let targetRoot = this.controller.recognizer.config.targetRoot;
      let targetRect = targetRoot.getBoundingClientRect();

      return {
        clientX: sample.targetX + targetRect.left,
        clientY: sample.targetY + targetRect.top
      }
    }

    private buildSyntheticTouchEvent(name: string, dict: TouchEventInit): TouchEvent {
      let config = this.controller.recognizer.config;

      let baseDict = {
        srcElement: config.touchEventRoot,
        view: window
      } as any;

      if(dict.bubbles !== undefined) {
        baseDict.bubbles = dict.bubbles; // is an event read-only property; can't assign it later!
        delete dict.bubbles;
      }

      // Produces a hacky-but-sufficient implementation of TouchList for our purposes
      // in environments that avoid direct touch-support.
      const arrToTouchList = (arr: Touch[]): TouchList => {
        return {
          //@ts-ignore
          _arr: arr, // Obviously, this isn't a standard member of TouchList.
          length: arr.length,
          item: function(i: number) { return this._arr[i]; }
        }
      }

      //@ts-ignore
      dict.touches = arrToTouchList(dict.touches);
      //@ts-ignore
      dict.changedTouches = arrToTouchList(dict.changedTouches);

      let event = new Event(name, baseDict) as TouchEvent;

      // Since touch-related properties aren't expected by some browsers' Event constructors,
      // we must add them "in post" when testing in some non-touch environments.  For those,
      // the Event constructor will neglect to copy them from `baseDict`.
      Object.assign(event, dict);
      return event;
    }

    replayTouchSample(sample: JSONObject<com.keyman.osk.InputSample>,
                      state: string,
                      identifier: number,
                      otherTouches: Touch[],
                      targetElement?: HTMLElement): Touch {
      let config = this.controller.recognizer.config;

      let event: TouchEvent;
      const mappedSample = this.getSampleClientPos(sample);

      let touch: Touch;
      let touchDict = {identifier: identifier,
                       target: targetElement || config.targetRoot,
                       ...mappedSample};
      if(window['Touch'] !== undefined) {
        touch = new Touch(touchDict);
      } else {
        // When not performing touch-emulation, some desktop browsers will leave `Touch` undefined.
        touch = touchDict as any;
      }

      otherTouches = otherTouches || [];

      let touchEventDict: TouchEventInit = {
        bubbles: true,
        touches: [touch, ...otherTouches],
        changedTouches: [touch],
      }

      let buildEvent = (type: string, dict: TouchEventInit) => {
        if(window['TouchEvent'] !== undefined) {
          // Nothing beats the real thing.
          return new TouchEvent(type, dict);
        } else {
          // Effectively, an internal polyfill.  But, if at ALL possible, use a real version instead!
          return this.buildSyntheticTouchEvent(type, dict);
        }
      }

      switch(state) {
        case 'start':
          event = buildEvent('touchstart', touchEventDict);
          break;
        case 'move':
          event = buildEvent('touchmove', touchEventDict);
          break;
        case 'end':
          event = buildEvent('touchend', touchEventDict);
          break;
      }

      config.targetRoot.dispatchEvent(event);

      return touch;
    }

    replayMouseSample(sample: JSONObject<com.keyman.osk.InputSample>, state: string, targetElement?: HTMLElement) {
      let config = this.controller.recognizer.config;

      let event: MouseEvent;
      let eventDict: MouseEventInit = {
        bubbles: true,
        buttons: state == 'end' ? 0 : 1,
        ...this.getSampleClientPos(sample)
      };

      switch(state) {
        case 'start':
          event = new MouseEvent('mousedown', eventDict);
          break;
        case 'move':
          event = new MouseEvent('mousemove', eventDict);
          break;
        case 'end':
          event = new MouseEvent('mouseup', eventDict);
          break;
      }

      targetElement = targetElement || config.targetRoot;

      // Implies that `targetElement` is the target element; .target cannot be set separately
      // for mouse events, so we can't use config.mouseEventRoot.  Don't worry, the
      // listener will still receive the event b/c bubbling.
      targetElement.dispatchEvent(event);
    }

    /**
     * Given a previously-recorded sequence of sampled input coordinates, this function
     * reproduces their corresponding events and runs them through this instance's linked
     * gesture-recognizer instance.
     *
     * It will re-use the original fixture-layout configuration, **but** it will ignore
     * all timestamp information, as that is nigh-impossible to perfectly reproduce without
     * busy-waiting.
     * @param sequenceTestSpec A previously-recorded sequence of sampled input coordinates.
     * @returns A recording of the reproduced version of that sequence.
     */
    replay(sequenceTestSpec: RecordedCoordSequenceSet): RecordedCoordSequenceSet {
      const set = sequenceTestSpec.set;
      const config = sequenceTestSpec.config;

      // We're going to record the test spec as we replay it, eventually returning the
      // final result.
      const recorder = new Testing.SequenceRecorder(this.controller);

      this.controller.layoutConfiguration = new FixtureLayoutConfiguration(config);

      /**
       * For each corresponding recorded sequence, notes the index of the sequence's
       * next sample to be 'replayed'.  If the full sequence has already been
       * replayed, its corresponding entry will be set to Number.MAX_VALUE instead.
       */
      let sequenceProgress: number[] = new Array(set.length).fill(0);
      let sequenceTouches: Touch[] = new Array(set.length).fill(null);

      while(sequenceProgress.find((number) => number != Number.MAX_VALUE) !== undefined) {
        // Determine the sequence that has the chronologically next-in-line sample
        // to reproduce.
        let minTimestamp = Number.MAX_VALUE;

        /**
         * Pulls double-duty as the index of the sequence owning said sample & as
         * the sequence's common 'identifier' value for emulated Touches.
         */
        let selectedSequence = -1;

        for(let index=0; index < set.length; index++) {
          const sequence = set[index].sequence;
          const indexInSequence = sequenceProgress[index];

          if(indexInSequence == Number.MAX_VALUE) {
            continue;
          }

          if(sequence.samples[indexInSequence].t < minTimestamp) {
            minTimestamp = sequence.samples[indexInSequence].t;
            selectedSequence = index;
          }
        }

        const sequence = set[selectedSequence].sequence;
        const indexInSequence = sequenceProgress[selectedSequence];
        let state: string = "move";

        let appendEndEvent = false;
        if(indexInSequence + 1 >= sequence.samples.length) {
          sequenceProgress[selectedSequence] = Number.MAX_VALUE;
          appendEndEvent = true;
        } else {
          sequenceProgress[selectedSequence]++;
        }

        if(indexInSequence == 0) {
          state = "start"
        }

        const sample = sequence.samples[indexInSequence];
        if(sequence.isFromTouch) {
          let otherTouches = [...sequenceTouches];
          otherTouches.splice(selectedSequence, 1);
          // Now that we've removed the entry for the current touchpoint, filter out any null entries.
          otherTouches = otherTouches.filter((val) => !!val);

          sequenceTouches[selectedSequence] = this.replayTouchSample(sample, state, selectedSequence, otherTouches);
          if(appendEndEvent) {
            this.replayTouchSample(sample, "end", selectedSequence, otherTouches);
            sequenceTouches[selectedSequence] = null;
          }
        } else {
          this.replayMouseSample(sample, state);
          if(appendEndEvent) {
            this.replayMouseSample(sample, "end");
          }
        }
      }

      // We technically don't have access to 'samples' for the actual recorded object.
      // Obtaining a 'deep copy' (though methodless) works around this nicely and
      // matches the original `sequenceTestSpec`'s format to boot.
      let recording = JSON.parse(recorder.recordingsToJSON()) as RecordedCoordSequenceSet;
      recorder.clear();
      return recording;
    }
  }
}