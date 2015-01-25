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

  var GoldenSpiral = {};

  /**
   * @param {number} depth Current depth
   * @returns {Array(Object)} data bound to the glyphs
   */
  GoldenSpiral.makeGlyphsData = function makeGlyphsData(depth) {
    return [
      { tag: 'rect', class: 'gs-square' },
      { tag: 'rect', class: 'gs-rect' },
      { tag: 'path', class: 'gs-spiral-stroke'}
    ];
  };

  /**
   * Forms the glyph -- applies styling, sizing, etc.  'this' is the glyph DOM element.
   *
   * @param {number} depth current depth
   * @param {boolean} isLastDepth true if this is the final layer of glyphs
   * @param {Object} d Datum created from the getGlyphsData
   */
  GoldenSpiral.formGlyph = function formGlyph(depth, isLastDepth, d, i) {
    var parentDatum = d3.select(this.parentNode).datum(),
        base = parentDatum.base;

    if (i === 0) {
      d3.select(this)
      .classed(d.class, true)
      .attr({width: base,
             height: base});
    } else if (i === 1) {
      d3.select(this)
      .classed(d.class, true)
      .attr({width: parentDatum.width - base,
             height: base,
             transform: UTIL.translate(base,0 )
            });
    } else if (i === 2) {
      d3.select(this)
      .classed(d.class, true)
      .attr({
        // Bezier curve -- looks a bit oblong
        //d: 'M 0 ' + base + ' Q 0 0 ' + base + ' 0',

        // Circle arc: rounder, but doesn't quite flow as cleanly as a bezier
        d: 'M :base 0 A :base :base 0 0 0 0 :base'.replace(/:base/g, base),

        stroke: 'black',
        fill: 'transparent'
      });
    }
  };

  /**
   * Creates an array of data for the subunits to be created
   *
   * @param {number} newDepth
   * @param {Object} parentDatum
   * @returns {Array(Object)} List of subunits' data.  MUST BE ARRAY EVEN IF ONLY ONE SUBUNIT
   */
  GoldenSpiral.makeSubunitsData = function makeSubUnitData(newDepth, parentDatum) {
    return [
      { depth: newDepth,
        width: parentDatum.base,
        base: parentDatum.base * PHI - parentDatum.base,
        parentBase: parentDatum.base
      },

      // double-recursive!
      { depth: newDepth,
        width: parentDatum.base,
        base: parentDatum.base * PHI - parentDatum.base,
        parentBase: parentDatum.base
      }
    ];
  };

  /**
   * Make the subunit take it's appropriate place.
   *
   * 'this' evaluates to the current subunit DOM element
   *
   * @param {Object} d datum bound to this subunit
   * @param {number} i Which subunit from the makeSubunitsData() array this is
   */
  GoldenSpiral.formSubunit = function(d, i) {
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

  return GoldenSpiral;
});
