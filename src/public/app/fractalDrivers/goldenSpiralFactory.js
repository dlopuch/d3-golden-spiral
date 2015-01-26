define(['d3', 'lodash'], function(d3, _) {
  var PHI = 1.61803398875,
      UTIL = {
        translate: function (x, y) {
          return 'translate(' + x + ',' + y + ')';
        },
        rotateDeg: function (deg, x, y) {
          var origin = typeof x !== 'undefined' ? ' ' + x + ' ' + y : '';
          return 'rotate(' + deg + origin + ')';
        }
      };

  /**
   * Factory to make a GoldenSpiral instance.
   *
   * @param {Object} opts:
   *   glyphs: {
   *     square: {boolean} (Defaults false) True to render GoldenSpiral squares
   *     rectangle: {false | Object} (Defaults false) Truthy to render rectangle, with options: {
   *       noLastHighlight: {boolean} (Defaults false) True to turn off special styling/highlighting for the last-layer
   *         rectangle
   *     }
   *     spiral: {boolean | Object} (Defaults Object) Truthy to turn on drawing spiral, with options: {
   *       bezier: {boolean} (Defaults false) True to use bezier curve instead of arc to draw spiral segments
   *       pathAttrs: {null | Object} (Defaults null) True to add any custom path overrides (stroke, fill, etc.)
   *       strokeFn: {null | function(unitD)} Function that is used to generate the 'stroke' attribute for spiral paths.
   *         Gets passed the repitition unit's data which contains the unit's size and specs, the most interesting
   *         attribute may be secondaryCount, which counts how many times this spiral unit has been the result of
   *         secondary spirals (ie if 'secondarySpiral' is false, this is always 0).
   *         Default function has domain [0,10] with a log-range ['#000', '#fff'].
   *         Note: If your pathAttrs specifies a .stroke, it will override this strokeFn.
   *     }
   *   }
   *   secondarySpiral: {boolean} (Defaults true) Truthy to include a secondary GoldenSpiral that starts with the width
   *     of the first square
   */
  var goldenSpiralFactory = function(opts) {
    // We're going to use factory/closure pattern instead of prototype inheritance because a GoldenSpiral instance will
    // be a bag of d3 callbacks, and d3 executes each callback in it's own context instead of the object context.
    // In other words, 'this' evaluation in all of these is going to follow the d3 model, not an object-instance model.
    // The object-instance parameters (options) will be made available via closure pattern.

    var secondarySpiralColorScale = d3.scale.log().domain([1, 11]).range(['#000', '#FFF']);

    opts = opts || {};
    opts = _.defaults(opts, {
      glyphs: _.defaults(opts.glyphs || {}, {
        square: false,
        rectangle: false,
        spiral: _.defaults(opts.glyphs && opts.glyphs.spiral || {}, {
          bezier: false,
          strokeFn: function(unitD) {
            return secondarySpiralColorScale((unitD.secondaryCount || 0) + 1); // +1 b/c scale starts at 1 b/c its log
          }
        })
      }),
      secondarySpiral: true
    });

    var goldenSpiralInstance = {
      name: "Golden Spiral"
    };

    /**
     * Initializes initial group
     *
     * @param {d3.Selection} gEl starting g
     */
    goldenSpiralInstance.initialize = function initialize(gEl) {
      var origSecondarySpiral = opts.secondarySpiral,
          gElWidth = parseInt( gEl.style('width') === 'auto' ? gEl.attr('width') : gEl.style('width') );

      if (isNaN(gElWidth))
        throw new Error('goldenSpiral must be initialized against an element with a width!');

      // Re-use makeSubunitsData() to make initial data
      opts.secondarySpiral = false;
      var initialDatum = goldenSpiralInstance.makeSubunitsData(0, {base: gElWidth} )[0];
      opts.secondarySpiral = origSecondarySpiral;

      var height = parseInt( gEl.style('height') === 'auto' ? gEl.attr('height') : gEl.style('height') );
      if (initialDatum.width / height > PHI) {
        throw new Error('Starting element must have width/height <= PHI');
      }

      gEl
      .datum(initialDatum)
      .attr('width', initialDatum.width + 'px')
      .attr('height', initialDatum.base + 'px');
    };

    /**
     * @param {number} depth Current depth
     * @returns {Array(Object)} data bound to the glyphs
     */
    goldenSpiralInstance.makeGlyphsData = function makeGlyphsData(depth, isLastDepth) {
      var glyphs = [];

      if (opts.glyphs.square)
        glyphs.push({ tag: 'rect', class: 'gs-square' });

      if (opts.glyphs.rectangle &&
          ( !opts.glyphs.rectangle.lastOnly || isLastDepth )) {
        glyphs.push({ tag: 'rect', class: 'gs-rect' });
      }

      if (opts.glyphs.spiral)
        glyphs.push({ tag: 'path', class: 'gs-spiral' });

      return glyphs;
    };

    /**
     * Forms the glyph -- applies styling, sizing, etc.  'this' is the glyph DOM element.
     *
     * @param {number} depth current depth
     * @param {boolean} isLastDepth true if this is the final layer of glyphs
     * @param {Object} d Datum created from the getGlyphsData
     */
    goldenSpiralInstance.formGlyph = function formGlyph(depth, isLastDepth, d, i) {
      var parentDatum = d3.select(this.parentNode).datum(),
          base = parentDatum.base;

      var el = d3.select(this).classed(d.class, true);

      if (d.class === 'gs-square') {
        el.attr({ width: base,
                  height: base });

      } else if (d.class === 'gs-rect') {
        el.attr({ width: parentDatum.width - base,
                  height: base,
                  transform: UTIL.translate(base,0 )
                });
        if (isLastDepth && !opts.glyphs.rectangle.noLastHighlight) {
          el.classed('gs-rect-last', true);
        }

      } else if (d.class === 'gs-spiral') {
        el.attr(_.extend({
          d: (opts.glyphs.spiral.bezier ?
            // Bezier curve -- looks a bit oblong
            'M 0 ' + base + ' Q 0 0 ' + base + ' 0':

            // Default Circle arc: rounder, but doesn't quite flow as cleanly as a bezier
            'M :base 0 A :base :base 0 0 0 0 :base'.replace(/:base/g, base)
          ),

          stroke: (!opts.glyphs.spiral.strokeFn ?
            '#000' :
            opts.glyphs.spiral.strokeFn(parentDatum)
          ),
          fill: 'transparent'
        }, opts.glyphs.spiral.pathAttrs));
      }
    };

    /**
     * Creates an array of data for the subunits to be created
     *
     * @param {number} newDepth
     * @param {Object} parentDatum
     * @returns {Array(Object)} List of subunits' data.  MUST BE ARRAY EVEN IF ONLY ONE SUBUNIT
     */
    goldenSpiralInstance.makeSubunitsData = function makeSubUnitData(newDepth, parentDatum) {
      var data = [
        { depth: newDepth,
          width: parentDatum.base,
          base: parentDatum.base * PHI - parentDatum.base,
          parentBase: parentDatum.base,
          secondaryCount: parentDatum.secondaryCount || 0
        }
      ];

      // double-recursive spiral!
      if (opts.secondarySpiral) {
        data.push({
          depth: newDepth,
          width: parentDatum.base,
          base: parentDatum.base * PHI - parentDatum.base,
          parentBase: parentDatum.base,
          secondaryCount: (parentDatum.secondaryCount || 0) + 1
        });
      }

      return data;
    };

    /**
     * Make the subunit take it's appropriate place.
     *
     * 'this' evaluates to the current subunit DOM element
     *
     * @param {Object} d datum bound to this subunit
     * @param {number} i Which subunit from the makeSubunitsData() array this is
     */
    goldenSpiralInstance.formSubunit = function(d, i) {
      if (i === 0) {
        d3.select(this)
        .attr({
          width: d.width + 'px',
          height: d.parentBase + 'px',
          transform: UTIL.rotateDeg(90, d.parentBase / 2, d.parentBase / 2) + ' ' +
                     UTIL.translate(0, -d.parentBase / PHI )
        });
      } else if (i===1) {
        d3.select(this)
        .attr({
          width: d.width + 'px',
          height: d.parentBase + 'px',
          transform: UTIL.translate(0, d.parentBase - d.base)
        });
      } else {
        throw new Error('unexpected i:' + i);
      }
    };

    return goldenSpiralInstance;
  };

  return goldenSpiralFactory;

});
