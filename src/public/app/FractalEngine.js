define(['d3', 'lodash'], function(d3, _) {
  // Some SVG tricks from reedspool: https://github.com/reedspool/golden_rectangle_d3/

  var DEFAULT_DEPTH = 5,
      UTILS = {
        keyByDataClass: function(d, i) {
          return d.class;
        },
        createSvgFromTag: function(d) {
          return this.ownerDocument.createElementNS('http://www.w3.org/2000/svg', d.tag);
        }
      };

  function FractalEngine(opts) {
    opts = _.defaults(opts || {}, {
      depth: DEFAULT_DEPTH
    });

    if (!opts.startG)
      throw new Error('Start g required!');

    if (!opts.driver)
      throw new Error('Fractal driver required!');

    this.opts = opts;

    this
    .setDriver(opts.driver)
    .setDepth(opts.depth)
    .draw();
  }

  FractalEngine.prototype.setDriver = function(newDriver) {
    this.driver = newDriver;
    // TODO: reset the initial G data so new drivers can reset as they need to.
    this._initDriver();
    return this;
  };

  FractalEngine.prototype._initDriver = function() {
    var startGData = this.opts.startG.datum();

    // Uninitialized G.  Create initial size and bind data.
    // TODO: Recognize new drivers!
    if (!startGData) {
      this.driver.initialize(this.opts.startG);
    }

    return this;
  };

  /**
   * Draws the fractal down to current depth.
   * @param {d3.selection} gEl selection of starting G element
   */
  FractalEngine.prototype.draw = function draw() {
    var gEl = this.opts.startG,
        driver = this.driver,
        levelD = gEl.datum();

    var depthI = 0;
    while (depthI < this._depth) {
      var isLastDepth = depthI === this._depth - 1;

      // Create glyphs for this depth level.
      // The driver returns a list of data objects.  Each datum must be an {Object} containing at least a .tag attr
      var glyphs = gEl.selectAll('.glyph.depth-' + depthI)
      .data(_.partial(driver.makeGlyphsData, depthI, isLastDepth), UTILS.keyByDataClass);

      // Using the data bind, create any new glyphs that don't yet exist
      glyphs.enter()
      .append(UTILS.createSvgFromTag)
      .classed('glyph depth-' + depthI, true);

      // update existing and enter()'d new glyphs
      // (need to update existing ones b/c behavior may change with isLastDepth (though optimizations possible))
      glyphs.each(_.partial(driver.formGlyph, depthI, isLastDepth));

      glyphs.exit().remove();


      // SUB-SECTIONS
      var subsections = gEl.selectAll('g.depth-' + (depthI + 1)) // need depth class or will select all underneath
      .data(_.partial(driver.makeSubunitsData, depthI + 1));

      if (isLastDepth) {
        gEl.classed('last', true);
        subsections.remove();

      } else {
        gEl.classed('last', false);

        subsections.enter()
        .append('svg:g')
        .classed('subunit depth-' + (depthI + 1), true)
        .each(driver.formSubunit);

        subsections.exit().remove();
      }

      gEl = subsections;

      depthI++;
    }
  };

  FractalEngine.prototype.setDepth = function setDepth(newDepth) {
    if (newDepth <= 0) {
      newDepth = DEFAULT_DEPTH;
    }

    this._depth = newDepth;
    return this;
  };

  return FractalEngine;
});
