define(['d3', 'lodash'], function(d3, _) {
  // General form and some tricks from reedspool: https://github.com/reedspool/golden_rectangle_d3/

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
    var _depth = DEFAULT_DEPTH;

    /**
     * GoldenSpiral constructor.
     *
     * Uses d3/mbostock re-usable component pattern (invoked by someD3Selection.call(someGoldenSpiralInstance))
     *
     * @param {d3.selection} gEl selection of starting G element
     */
    function GoldenSpiral(gEl) {
      var levelD = gEl.datum();

      // Uninitialized G.  Create initial size and bind data.
      // (otherwise we assume it's a GoldenSpiral-created G, so right size and has sizes in data binding)
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
          throw new Error('GoldenSpiral must be initialized against an element with a width!');
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

        // Create glyphs for this depth level
        // GoldenSpiral: only one glyph -- the square -- so data array of 1
        var glyphs = gEl.selectAll('.glyph')
        .data([
          { tag: 'rect', class: 'square' }
        ]);

        // Create any new glyphs that don't yet exist
        glyphs.enter()
        .append(function(d) {
          return this.ownerDocument.createElementNS('http://www.w3.org/2000/svg', d.tag);
        })
        .classed('glyph', true)
        .each(function(d) {
          d3.select(this).classed(d.class, true);
        })
        .each(function(d) {
          var parentDatum = d3.select(this.parentNode).datum();
          d3.select(this)
          .classed(d.class, true)
          .attr({width: parentDatum.base,
                 height: parentDatum.base});
        });


        // SUB-SECTIONS
        // GoldenSpiral: Only one sub-section
        var subsections = gEl.selectAll('g')
        .data([
          { makeRealData: function(d) {
              var parentDatum = d3.select(this.parentNode).datum();
              return {
                depth: depthI + 1,
                width: parentDatum.base,
                base: parentDatum.base * PHI - parentDatum.base
              };
            },
            scaleMyself: function(d) {
              var base = d3.select(this.parentNode).datum().base;
              d3.select(this)
              .attr({
                width: d.width + 'px',
                height: d.base + 'px',
                transform: UTIL.rotateDeg(90, base / 2, base / 2) + ' ' + UTIL.translate(0, -base / PHI )
              });
            }
          }
        ]);

        if (isLastDepth) {
          subsections.remove();
        } else {
          // Re-calculate proper data for existing subsections (bound different data to do selection)
          subsections.each(function(d) {
            var newDatum = d.makeRealData.call(this, d);
            d3.select(this).datum(newDatum);
          });

          // Or, create new subsections if they don't exist (eg new depth reached)
          subsections.enter()
          .append('svg:g')
          .classed('subsection', true)
          .each(function(d) {
            var newDatum = d.makeRealData.call(this, d);
            d3.select(this).datum(newDatum);
            d.scaleMyself.call(this, newDatum);
          });

          subsections.exit()
          .remove();
        }

        gEl = subsections;

        depthI++;
      }
      /*jshint loopfunc:false */
    }

    GoldenSpiral.setDepth = function(newDepth) {
      if (newDepth < 0) {
        newDepth = DEFAULT_DEPTH;
      }

      _depth = newDepth;
      return this;
    };

    return GoldenSpiral;
  };
});
