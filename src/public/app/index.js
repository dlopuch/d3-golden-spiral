define(['d3', 'lodash', 'makeGoldenSpiral'], function(d3, _, makeGoldenSpiral) {
  var svg = d3.select('svg').attr({width: 400, height: 250}),
      spiralStartEl = svg.append('svg:g')
        .attr({
          width : (parseInt(svg.style('width')) - 4) + 'px',
          height: (parseInt(svg.style('height')) - 4) + 'px'
        });

  var goldenSpiral = makeGoldenSpiral();

  window.drawGoldenSpiral = function(depth) {
    goldenSpiral.setDepth(depth);
    spiralStartEl.call(goldenSpiral);
  };
  window.drawGoldenSpiral(1);
});
