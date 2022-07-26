namespace com.keyman.osk {
  /**
   * Supported events:
   *
   * - 'update':  a new sample (coord + timestamp) has been observed
   * - 'cancel':  all gesture recognition on the sequence is to be cancelled
   *                   and left incomplete.
   * - 'end':     all gesture recognition on the sequence is to be resolved.
   */
  export class Incomplete<Type, UpdateType> extends EventEmitter {
    public readonly item: Type;

    private isActive = true;

    constructor(item: Type) {
      super();

      this.item = item;
    }

    cancel() {
      if(this.isActive) {
        this.isActive = false;
        this.emit('cancel', this);
        this.removeAllListeners();
      }
    }

    end() {
      if(this.isActive) {
        this.isActive = false;
        this.emit('end', this);
        this.removeAllListeners();
      }
    }
  }
}