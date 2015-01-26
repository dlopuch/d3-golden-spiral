define(['d3', 'lodash', 'FractalEngine', 'fractalDrivers/goldenSpiralFactory'],
  function(d3, _, FractalEngine, goldenSpiralFactory) {

    var svg = d3.select('svg').attr({width: 400, height: 250}),
        spiralStartEl = svg.append('svg:g')
          .attr({
            width : (parseInt(svg.style('width')) - 4) + 'px',
            height: (parseInt(svg.style('height')) - 4) + 'px'
          });

    var goldenSpiral = new FractalEngine({
      depth: 1,
      startG: spiralStartEl,
      driver: goldenSpiralFactory({
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
      })
    });

    window.drawGoldenSpiral = function(depth) {
      goldenSpiral.setDepth(depth).draw();
    };

    console.log('Starting drawing loop.  Console "stop()" to stop.');
    var depth = 1,
        inc = 1;
    window.drawInterval = setInterval(function() {
      console.log('drawGoldenSpiral(' + depth + ')');
      window.drawGoldenSpiral(depth);
      depth += inc;

      if (depth >= 10) {
        inc = -1;
      } else if (depth <= 1) {
        inc = 1;
      }
    }, 300);

    window.stop = function() {
      window.clearInterval(window.drawInterval);
    };

  }
);
