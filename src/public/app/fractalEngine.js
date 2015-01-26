define(['d3', 'lodash', 'fractalDrivers/goldenSpiralFactory'], function(d3, _, goldenSpiralFactory) {
  // Some SVG tricks from reedspool: https://github.com/reedspool/golden_rectangle_d3/

  var PHI = 1.61803398875,
      DEFAULT_DEPTH = 5,
      UTIL = {
        translate: function (x, y) {
          return 'translate(' + x + ',' + y + ')';
        },
        rotateDeg: function (deg, x, y) {
          var origin = typeof x !== 'undefined' ? ' ' + x + ' ' + y : '';
          return 'rotate(' + deg + origin + ')';
        }
      };

  return function spiralFactory() {
    // options:
    var _depth = DEFAULT_DEPTH,
        goldenSpiral = goldenSpiralFactory({
          glyphs: {
            // square: true,
            // rectangle: {
              // //noLastHighlight: true,
              // lastOnly: true
            // },

            // spiral: false,
            spiral: {
              //bezier: true,
              pathAttrs: {
                //fill: "",
                //style: "opacity: 0.5"
              }
            }
          },
          //secondarySpiral: false
        });

    /**
     * FractalEngine constructor.
     *
     * Uses d3/mbostock re-usable component pattern (invoked by someD3Selection.call(somegoldenSpiralInstance))
     *
     * @param {d3.selection} gEl selection of starting G element
     */
    function FractalEngine(gEl) {
      var levelD = gEl.datum();

      // Uninitialized G.  Create initial size and bind data.
      // (otherwise we assume it's a goldenSpiral-created G, so right size and has sizes in data binding)
      if (!levelD) {
        levelD = {
          depth: 0
        };

        levelD.width = parseInt( gEl.style('width') === 'auto' ? gEl.attr('width') : gEl.style('width') );

        var height = parseInt( gEl.style('height') === 'auto' ? gEl.attr('height') : gEl.style('height') );
        if (levelD.width / height > PHI) {
          throw new Error('Starting element must have width/height <= PHI');
        }

        gEl.datum(levelD);

        if (isNaN(levelD.width)) {
          throw new Error('goldenSpiral must be initialized against an element with a width!');
        }

        levelD.base = levelD.width / PHI;

        gEl
        .attr('width', levelD.width + 'px')
        .attr('height', levelD.base + 'px');
      }

      var depthI = 0;
      /*jshint loopfunc:true */
      while (depthI < _depth) {
        var isLastDepth = depthI === _depth - 1;

        // Create glyphs for this depth level.
        // The driver returns a list of data objects.  Each datum must be an {Object} containing at least a .tag attr
        var glyphs = gEl.selectAll('.glyph.depth-' + depthI)
        .data(_.partial(goldenSpiral.makeGlyphsData, depthI, isLastDepth), function(d, i) {
          return d.class;
        });

        // Using the data bind, create any new glyphs that don't yet exist
        glyphs.enter()
        .append(function(d) {
          return this.ownerDocument.createElementNS('http://www.w3.org/2000/svg', d.tag);
        })
        .classed('glyph depth-' + depthI, true);

        // update existing and enter()'d new glyphs
        // (need to update existing ones b/c behavior may change with isLastDepth (though optimizations possible))
        glyphs.each(_.partial(goldenSpiral.formGlyph, depthI, isLastDepth));

        glyphs.exit().remove();


        // SUB-SECTIONS
        var subsections = gEl.selectAll('g.depth-' + (depthI + 1)) // need depth class or will select all underneath
        .data(_.partial(goldenSpiral.makeSubunitsData, depthI + 1));

        if (isLastDepth) {
          gEl.classed('last', true);
          subsections.remove();

        } else {
          gEl.classed('last', false);

          subsections.enter()
          .append('svg:g')
          .classed('subunit depth-' + (depthI + 1), true)
          .each(goldenSpiral.formSubunit);

          subsections.exit().remove();
        }

        gEl = subsections;

        depthI++;
      }
      /*jshint loopfunc:false */
    }

    FractalEngine.setDepth = function(newDepth) {
      if (newDepth < 0) {
        newDepth = DEFAULT_DEPTH;
      }

      _depth = newDepth;
      return this;
    };

    return FractalEngine;
  };
});
