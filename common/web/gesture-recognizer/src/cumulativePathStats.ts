namespace com.keyman.osk {
  /**
   * As the name suggests, this class facilitates tracking of cumulative mathematical values, etc
   * necessary to perform the statistical operations necessary for path segmentation.
   *
   * Instances of this class are immutable.
   */
  export class CumulativePathStats {
    // So... class-level "inner classes" are possible in TS... if defined via assignment to a field.
    /**
     * Provides linear-regression statistics & fitting values based on the underlying `CumulativePathStats`
     * object used to generate it.  All operations are O(1).
     */
    static readonly regression = class RegressionFromSums {
      readonly independent: 'x' | 'y' | 't';
      readonly dependent:   'x' | 'y' | 't';
      readonly paired:      'tx' | 'ty' | 'xy';

      readonly accumulator: CumulativePathStats;

      /**
       *
       * @param mainStats       The `CumulativePathStats` instance to base all regression data on.
       * @param dependentAxis   The 'output' axis / dimension; the axis whose behavior should be predicted based on
       *                        existing data of its relationship with the independent axis.
       * @param independentAxis The 'input' axis/dimension.
       */
      constructor(mainStats: CumulativePathStats, dependentAxis: 'x' | 'y' | 't', independentAxis: 'x' | 'y' | 't') {
        if(dependentAxis == independentAxis) {
          throw "Two different axes must be specified for the regression object.";
        }

        this.accumulator = mainStats;

        this.dependent   = dependentAxis;
        this.independent = independentAxis;

        if(dependentAxis < independentAxis) {
          this.paired = dependentAxis.concat(independentAxis) as 'tx' | 'ty' | 'xy';
        } else {
          this.paired = independentAxis.concat(dependentAxis) as 'tx' | 'ty' | 'xy';
        }
      }

      /**
       * The 'slope' of the 'slope-intercept' form of the line that best fits the relationship between
       * this regression's selected axes.
       */
      get slope(): number {
        // The technical definition is the commented-out line, but the denominator component of both
        // cancels out - it's 'more efficient' to use the following line as a result.

        // this.accumulator.covariance(this.paired) / this.accumulator.variance(this.independent);
        const val = this.accumulator.crossSum(this.paired) / this.accumulator.squaredSum(this.independent);
        return val;
      }

      /**
       * The 'intercept' of the 'slope-intercept' form of the line that best fits the relationship between
       * this regression's selected axes.
       */
      get intercept(): number {
        // Performing a regression based on these pre-summed values means that our obtained intercept is in
        // the mapped coordinate system.
        const mappedIntercept = this.accumulator.mappedMean(this.dependent) - this.slope * this.accumulator.mappedMean(this.independent);

        const val =  mappedIntercept + this.accumulator.mappingConstant(this.dependent) -
          this.slope * this.accumulator.mappingConstant(this.independent);

        return val;
      }

      /**
       * The total summed squared-distances of the best fitting line from actually-observed values;
       * in other words, the "sum of the squared errors".
       *
       * Statistically, this is the portion of the dependent variable's variance (un-normalized)
       * that is unexplained by this regression.
       */
      get sumOfSquaredError(): number {
        return this.accumulator.squaredSum(this.dependent) - this.sumOfSquaredModeled;
      }

      /**
       * The portion of the dependent variable's variance that is successfully explained by this regression.
       */
      get sumOfSquaredModeled(): number {
        // If we have a perfectly straight vertical line, from the perspective of our independent axis,
        // we get infinite slope.  That's... not great for the math.
        //
        // Fortunately, it ALSO means that we can perfectly model the segment.
        if(this.accumulator.squaredSum(this.independent) == 0) {
          return this.accumulator.squaredSum(this.dependent);
        } else {
          return this.slope * this.accumulator.crossSum(this.paired);
        }
      }

      /**
       * A statistical term that signals how successful the regression is.  Always has values on
       * the interval [0, 1], with 1 being a perfect fit.
       */
      get coefficientOfDetermination(): number {
        if(this.accumulator.squaredSum(this.dependent) == 0 || this.accumulator.squaredSum(this.independent) == 0) {
          return 1;
        }

        const acc = this.accumulator;
        const num = acc.crossSum(this.paired) * acc.crossSum(this.paired);
        const denom = acc.squaredSum(this.dependent) * acc.squaredSum(this.independent);

        return num / denom;
      }

      /**
       * Gets the value of the dependent axis that lies on the regression's fitted line
       * for a specified independent axis value.
       *
       * @param value The input value to use for the independent axis's variable.
       * @returns     The predicted dependent axis value.
       */
      predictFromValue(value: number) {
        return this.slope * value + this.intercept;
      }
    }

    private rawLinearSums: {'x': number, 'y': number, 't': number, 'v': number} = {'x': 0, 'y': 0, 't': 0, 'v': 0};
    private rawSquaredSums: {'x': number, 'y': number, 't': number, 'v': number} = {'x': 0, 'y': 0, 't': 0, 'v': 0};
    // Would 'tv' (time vs velocity) be worth it to track?  And possibly even do a regression for?
    // If so, maybe throw that in.
    private rawCrossSums: {'tx': number, 'ty': number, 'xy': number} = {'tx': 0, 'ty': 0, 'xy': 0};

    private coordArcSum: number = 0;
    private arcSampleCount: number = 0;

    // These two are kept separate because of their extreme interconnectedness - after all,
    // they actually represent a SINGLE (polar) axis - the angle.
    //
    // Sadly, there's no straightforward, well-founded way to use these to give a proper
    // statistical sense of 'fit' or 'regression' here, _especially_ in regard to segmentation.
    // Proper angle-[other] cross-sums are pretty much impossible, at least as efficiently
    // as the others are handled [O(1)].
    private cosLinearSum:   number = 0;
    private sinLinearSum:   number = 0;

    /**
     * The base sample used to transpose all other received samples.  Use of this helps
     * avoid potential "catastrophic cancellation" effects that can occur when diffing
     * two numbers far from the sample-space's mathematical origin.
     *
     * Refer to https://en.wikipedia.org/wiki/Catastrophic_cancellation.
     */
    private baseSample?: InputSample;

    /**
     * The initial sample included by this instance's computed stats.  Needed for
     * the 'directness' properties.
     */
    private initialSample?: InputSample;

    private _lastSample?: InputSample;
    private followingSample?: InputSample;
    private _sampleCount = 0;

    constructor();
    constructor(sample: InputSample);
    constructor(instance: CumulativePathStats);
    constructor(obj?: InputSample | CumulativePathStats) {
      if(!obj) {
        return;
      }

      // Will worry about JSON form later.
      if(obj instanceof CumulativePathStats) {
        Object.assign(this, obj);

        this.rawLinearSums = {...obj.rawLinearSums};
        this.rawCrossSums  = {...obj.rawCrossSums};
        this.rawSquaredSums   = {...obj.rawSquaredSums};
      } else if(isAnInputSample(obj)) {
        Object.assign(this, this.extend(obj));
      }
    }

    /**
     * Statistically "observes" a new sample point on the touchpath, accumulating values
     * useful for provision of relevant statistical properties.
     * @param sample A newly-sampled point on the touchpath.
     * @returns A new, separate instance for the cumulative properties up to the
     *          newly-sampled point.
     */
    public extend(sample: InputSample): CumulativePathStats {
      if(!this.initialSample) {
        this.initialSample = sample;
        this.baseSample = sample;
      }
      const result = new CumulativePathStats(this);

      // Set _after_ deep-copying this for the result.
      this.followingSample = sample;

      // Helps prevent "catastrophic cancellation" issues from floating-point computation
      // for these statistical properties and properties based upon them.
      const x = sample.targetX - this.baseSample.targetX;
      const y = sample.targetY - this.baseSample.targetY;
      const t = sample.t - this.baseSample.t;

      result.rawLinearSums['x'] += x;
      result.rawLinearSums['y'] += y;
      result.rawLinearSums['t'] += t;

      result.rawCrossSums['tx'] += t * x;
      result.rawCrossSums['ty'] += t * y;
      result.rawCrossSums['xy'] += x * y;

      result.rawSquaredSums['x'] += x * x;
      result.rawSquaredSums['y'] += y * y;
      result.rawSquaredSums['t'] += t * t;

      if(this.lastSample) {
        // arc length stuff!
        const xDelta = sample.targetX - this.lastSample.targetX;
        const yDelta = sample.targetY - this.lastSample.targetY;
        const tDelta = sample.t       - this.lastSample.t;
        const tDeltaInSec = tDelta / 1000;

        const coordArcDeltaSq = xDelta * xDelta + yDelta * yDelta;
        const coordArcDelta = Math.sqrt(coordArcDeltaSq);

        result.coordArcSum     += Math.sqrt(coordArcDeltaSq);

        if(xDelta || yDelta) {
          // We wish to measure angle clockwise from <0, -1> in the DOM.  So, cos values should
          // align with that axis, while sin values should align with the positive x-axis.
          //
          // This provides a mathematical 'transformation' to the axes used by `atan2` in the
          // `angleMean` property.
          result.cosLinearSum   += -yDelta / coordArcDelta;
          result.sinLinearSum   +=  xDelta / coordArcDelta;
          result.arcSampleCount += 1;
        }

        if(tDeltaInSec) {
          result.rawLinearSums['v']  += Math.sqrt(coordArcDeltaSq) / tDeltaInSec;
          result.rawSquaredSums['v'] += coordArcDeltaSq / (tDeltaInSec * tDeltaInSec);
        }
      }

      result._lastSample = sample;
      result.sampleCount = this.sampleCount + 1;

      return result;
    }

    /**
     * "De-accumulates" currently-accumulated values corresponding to the specified
     * subset, which should represent an earlier, previously-observed part of the path.
     * @param subsetStats The accumulated stats for the part of the path being removed
     *                    from this instance's current accumulation.
     * @returns
     */
    public deaccumulate(subsetStats?: CumulativePathStats): CumulativePathStats {
      // Possible addition:  use `this.buildRenormalized` on the returned version
      // if catastrophic cancellation effects (random, small floating point errors)
      // are not sufficiently mitigated & handled by the measures currently in place.
      //
      // Even then, we'd need to apply such generated objects carefully - we can't
      // re-merge the accumulated values or remap them to their old coordinate system
      // afterward.`buildRenormalize`'s remapping maneuver is a one-way stats-abuse trick.
      //
      // Hint: we'd need to pay attention to the "lingering segments" aspects in which
      // detected sub-segments might be "re-merged".
      // - Whenever they're merged & cleared, we should be clear to recentralize
      //   the cumulative stats that follow.  If any are still active, we can't
      //   recentralize.

      const result = new CumulativePathStats(this);

      // We actually WILL accept a `null` argument; makes some of the segmentation
      // logic simpler.
      if(!subsetStats) {
        return result;
      }

      if(!subsetStats.followingSample || !subsetStats.lastSample) {
        throw 'Invalid argument:  stats missing necessary tracking variable.';
      }

      for(let dim in result.rawLinearSums) {
        result.rawLinearSums[dim] -= subsetStats.rawLinearSums[dim];
      }

      for(let dimPair in result.rawCrossSums) {
        result.rawCrossSums[dimPair] -= subsetStats.rawCrossSums[dimPair];
      }

      for(let dim in result.rawSquaredSums) {
        result.rawSquaredSums[dim] -= subsetStats.rawSquaredSums[dim];
      }

      // arc length stuff!
      if(subsetStats.followingSample && subsetStats.lastSample) {
        const xDelta = subsetStats.followingSample.targetX - subsetStats.lastSample.targetX;
        const yDelta = subsetStats.followingSample.targetY - subsetStats.lastSample.targetY;
        const tDelta = subsetStats.followingSample.t       - subsetStats.lastSample.t;
        const tDeltaInSec = tDelta / 1000;

        const coordArcSq = xDelta * xDelta + yDelta * yDelta;

        // Due to how arc length stuff gets segmented.
        // There's the arc length within the prefix subset (operand 2 below) AND the part connecting it to the
        // 'remaining' subset (operand 1 below) before the portion wholly within what remains (the result)
        result.coordArcSum     -= Math.sqrt(coordArcSq);
        result.coordArcSum     -= subsetStats.coordArcSum;

        result.cosLinearSum   -= subsetStats.cosLinearSum;
        result.sinLinearSum   -= subsetStats.sinLinearSum;
        result.arcSampleCount -= subsetStats.arcSampleCount;

        if(tDeltaInSec) {
          result.rawLinearSums['v']  -= Math.sqrt(coordArcSq) / tDeltaInSec;
          result.rawSquaredSums['v'] -= coordArcSq / (tDeltaInSec * tDeltaInSec);
        }
      }

      result.sampleCount -= subsetStats.sampleCount;

      // NOTE: baseSample MUST REMAIN THE SAME.  All math is based on the corresponding diff.
      // Though... very long touchpoint interactions could start being affected by that "catastrophic
      // cancellation" effect without further adjustment.  (If it matters, we'll get to that later.)
      // But _probably_ not; we don't go far beyond a couple of orders of magnitude from the origin in
      // ANY case except the timestamp (.t) - and even then, not far from the baseSample's timestamp value.

      // initialSample, though, we need to update b/c of the 'directness' properties.
      result.initialSample = subsetStats.followingSample;

      return result;
    }

    public get lastSample() {
      return this._lastSample;
    }

    public get lastTimestamp(): number {
      return this.lastSample?.t;
    }

    public get sampleCount() {
      return this._sampleCount;
    }

    private set sampleCount(value: number) {
      this._sampleCount = value;
    }

    /**
     * In order to mitigate the accumulation of small floating-point errors during the
     * various accumulations performed by this class, the domain of incoming values
     * is remapped near to the origin via axis-specific mapping constants.
     * @param dim
     * @returns
     */
    private mappingConstant(dim: 'x' | 'y' | 't' | 'v') {
      if(!this.baseSample) {
        return undefined;
      }

      if(dim == 't') {
        return this.baseSample.t;
      } else if(dim == 'x') {
        return this.baseSample.targetX;
      } else if(dim == 'y') {
        return this.baseSample.targetY;
      } else {
        return 0;
      }
    }

    /**
     * Gets the statistical mean, utilizing the internal 'mapped' coordinate space.
     * This is the version compatible with cross-sums and squared-sums.
     * @param dim
     * @returns
     */
    private mappedMean(dim: 'x' | 'y' | 't' |'v') {
      return this.rawLinearSums[dim] / this.sampleCount;
    }

    /**
     * Gets the statistical mean value of the samples observed during the represented
     * interval on the specified axis.
     * @param dim
     * @returns
     */
    public mean(dim: 'x' | 'y' | 't' | 'v') {
      // This external-facing version needs to provide values in 'external'-friendly
      // coordinate space.
      return this.mappedMean(dim) + this.mappingConstant(dim);
    }

    /**
     * Gets the sum of the squared distance from the mean seen in samples observed
     * during the represented interval on the specified axis.
     * @param dim
     * @returns
     */
    public squaredSum(dim: 'x' | 'y' | 't' | 'v') {
      const x2 = this.rawSquaredSums[dim];
      const x1 = this.rawLinearSums[dim];

      const val = x2 - x1 * x1 / this.sampleCount;

      return val > 1e-8 ? val : 0;
    }

    /**
     * Gets the sum of the statistical 'cross' term "distance" away from the mean
     * observed during the represented interval on the specified axis.
     * @param dimPair
     * @returns
     */
    public crossSum(dimPair: 'tx' | 'ty' | 'xy') {
      const dim1 = dimPair.charAt(0);
      const dim2 = dimPair.charAt(1);

      let orderedDims: string = dimPair;
      if(dim2 < dim1) {
        orderedDims = dim2.concat(dim1);
      }

      const ab = this.rawCrossSums[orderedDims];
      const a  = this.rawLinearSums[dim1];
      const b  = this.rawLinearSums[dim2];

      const val = ab - a * b / this.sampleCount;

      // Don't forget - cross-sums can be negative!
      return Math.abs(val) > 1e-8 ? val : 0;
    }

    /**
     * Gets the unbiased covariance between the specified pair of axes for samples
     * observed during the represented interval.
     * @param dimPair
     * @returns
     */
    public covariance(dimPair: 'tx' | 'ty' | 'xy') {
      return this.crossSum(dimPair) / (this.sampleCount - 1);
    }

    /**
     * Gets the unbiased variance on the specified axis for samples observed
     * during the represented interval.
     */
    public variance(dim: 'x' | 'y' | 't' | 'v') {
      return this.squaredSum(dim) / (this.sampleCount - 1);
    }

    /**
     * Utilizing (and possibly abusing) statistical identities, this function produces
     * an equivalent, but-recentered copy of this instance's statistical accumulations
     * that will be less prone to catastrophic cancellation.
     *
     * In non-stats speak, the new instance will suffer smaller floating-point
     * errors than the old instance whenever they do occur.
     * @returns
     */
    public buildRenormalized(): CumulativePathStats {
      // Other (internal) notes:  the internal mapping of the new instance will not
      // match that of the old instance.  This should not affect the practical
      // results of any mapping to and from the external coordinate space, however.
      let result = new CumulativePathStats(this);

      let newBase: InputSample = {
        targetX: this.mappedMean['x'] + this.baseSample.targetX,
        targetY: this.mappedMean['y'] + this.baseSample.targetY,
        t:       this.mappedMean['t'] + this.baseSample.t
      };

      result.baseSample = newBase;

      for(const dimPair in result.rawCrossSums) {
        result.rawCrossSums[dimPair] = this.crossSum(dimPair as 'tx' | 'ty' | 'xy');
      }

      for(const dim in result.rawSquaredSums) {
        result.rawSquaredSums[dim] = this.squaredSum(dim as 'x' | 'y' | 't');
      }

      return result;
    }

    /**
     * Provides a linear-regression perspective on two specified axes over the represented
     * interval.
     * @param dependent
     * @param independent
     * @returns
     */
    public fitRegression(dependent: 'x' | 'y' | 't', independent: 'x' | 'y' | 't') {
      return new CumulativePathStats.regression(this, dependent, independent);
    }

    /**
     * Provides the direct Euclidean distance between the start and end points of the segment
     * (or curve) of the interval represented by this instance.
     *
     * This will likely not match the actual pixel distance traveled.
     */
    public get netDistance() {
      // No issue with a net distance of 0 due to a single point.
      if(!this.lastSample || !this.initialSample) {
        return Number.NaN;
      }

      const xDelta = this.lastSample.targetX - this.initialSample.targetX;
      const yDelta = this.lastSample.targetY - this.initialSample.targetY;

      return Math.sqrt(xDelta * xDelta + yDelta * yDelta);
    }

    /**
     * Gets the duration of the represented interval, in seconds.
     *
     * Note: input samples provide their timestamps in milliseconds.
     */
    public get duration() {
      // no issue with a duration of zero from just one sample.
      if(!this.lastSample || !this.initialSample) {
        return Number.NaN;
      }
      return (this.lastSample.t - this.initialSample.t) * 0.001;
    }

    /**
     * Returns the angle (in radians) traveled by the corresponding segment clockwise
     * from the unit vector <0, -1> in the DOM (the unit "upward" direction).
     */
    public get angle() {
      if(this.sampleCount == 1 || !this.lastSample || !this.initialSample) {
        return Number.NaN;
      } else if(this.netDistance < 1) {
        // < 1 px, thus sub-pixel, means we have nothing relevant enough to base an angle on.
        return Number.NaN;
      }

      const xDelta = this.lastSample.targetX - this.initialSample.targetX;
      const yDelta = this.lastSample.targetY - this.initialSample.targetY;
      const yAngleDiff = Math.acos(-yDelta / this.netDistance);

      return xDelta < 0 ? (2 * Math.PI - yAngleDiff) : yAngleDiff;
    }

    /**
     * Returns the angle (in degrees) traveled by the corresponding segment clockwise
     * from the unit vector <0, -1> in the DOM (the unit "upward" direction).
     */
    public get angleInDegrees() {
      return this.angle * 180 / Math.PI;
    }

    /**
     * Returns the cardinal or intercardinal direction on the screen that most
     * closely matches the direction of movement represented by the represented
     * segment.
     *
     * @return A string one or two letters in length.  (e.g:  'n', 'sw')
     */
    public get cardinalDirection() {
      if(this.sampleCount == 1 || !this.lastSample || !this.initialSample) {
        return undefined;
      }

      const angle = this.angleInDegrees;
      const buckets = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

      for(let threshold = 22.5, bucketIndex = 0; threshold < 360; threshold += 45, bucketIndex += 1) {
        if(angle < threshold) {
          return buckets[bucketIndex];
        }
      }

      return 'n';
    }

    /**
     * Measured in pixels per second.
     */
    public get speed() {
      // this.duration is already in seconds, not milliseconds.
      return this.duration ? this.netDistance / this.duration : Number.NaN;
    }

    /**
     * Returns the represented interval's 'mean angle' clockwise from the DOM's
     * <0, -1> (the unit vector toward the top of the screen) in radians.
     *
     * Based upon the 'circular mean'.  Refer to https://en.wikipedia.org/wiki/Circular_mean.
     *
     * Note that very slow-moving segments may be heavily affected by pixel aliasing
     * effects; mouse and touch events usually do not provide sub-pixel resolution.
     */
    public get angleMean() {
      if(this.arcSampleCount == 0) {
        return Number.NaN;
      }

      // Neato reference: https://rosettacode.org/wiki/Averages/Mean_angle
      // But we don't actually need to divide by sample count; `atan2` handles that!
      const sinMean = this.sinLinearSum;
      const cosMean = this.cosLinearSum;

      let angle = Math.atan2(sinMean, cosMean);  // result:  on the interval (-pi, pi]
      // Convert to [0, 2*pi).
      if(angle < 0) {
        angle = angle + 2 * Math.PI;
      }

      return angle;
    }

    /**
     * Provides the rSquared value needed internally for circular-statistic properties.
     *
     * Range:  floating-point values on the interval [0, 1].
     */
    private get angleRSquared() {
      // https://www.ebi.ac.uk/thornton-srv/software/PROCHECK/nmr_manual/man_cv.html may be a useful
      // reference for this tidbit.  The Wikipedia article's more dense... not that this link isn't
      // a bit dense itself.
      const rSquaredBase = this.cosLinearSum * this.cosLinearSum + this.sinLinearSum * this.sinLinearSum;
      return rSquaredBase / (this.arcSampleCount * this.arcSampleCount);
    }

    /**
     * The **circular standard deviation** of the represented interval's angle observations.
     *
     * Refer to https://en.wikipedia.org/wiki/Directional_statistics#Standard_deviation.
     *
     * Note that very slow-moving segments may be heavily affected by pixel aliasing
     * effects; mouse and touch events usually do not provide sub-pixel resolution.
     * This can result in very high deviation values.
     *
     * In less-technical terms - the "stair-stepping" effect seen on high zoom levels means we don't
     * get perfectly straight lines, and that can cause this value to be unexpectedly high.
     */
    public get angleDeviation() {
      if(this.arcSampleCount == 0) {
        return Number.NaN;
      }

      return Math.sqrt(-Math.log(this.angleRSquared));
    }

    /**
     * Provides the actual, pixel-based distance actually traveled by the represented segment.
     * May not be an integer (because diagonals are a thing).
     */
    public get rawDistance() {
      return this.coordArcSum;
    }

    // Convert to a `toJSON` method for use during investigative debugging.
    private toDebuggingJSON() {
      // This `likelyState` value is extremely prototyped & just here for reviewer/tester convenience.
      // It'll need to be developed a bit more fully, but follows my intuitions from development &
      // testing.
      let likelyState = 'unknown';

      if(this.mean('v') < 80 && this.rawDistance < 12 && this.duration > 0.1) {
        likelyState = 'hold';
      } else if(this.mean('v') < 80 && this.rawDistance < 6) {
        likelyState = 'hold';
      }

      if(this.mean('v') > 400 || (this.mean('v') > 200 && this.duration > 0.1) || this.netDistance > 20) {
        likelyState = 'move';
      }

      return {
        angle: this.angle,
        cardinal: this.cardinalDirection,
        likelyType: likelyState,
        speedMean: this.mean('v'),
        rawDistance: this.rawDistance,
        duration: this.duration,
        sampleCount: this.sampleCount,
        angleMeanDegrees: this.angleMean * 180 / Math.PI,
        angleDeviation: this.angleDeviation,
        speedVariance: this.variance('v')
      }
    }

    public toJSON() {
      // We're not actually saving the JSON out to anything yet or loading/parsing it
      // for any use beyond direct human interpretation, so... it's "okay" to
      // leave like this for now.
      return this.toDebuggingJSON();
    }
  }

}