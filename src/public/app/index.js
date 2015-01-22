define(['d3', 'lodash', 'fractalEngine'], function(d3, _, makeGoldenSpiral) {
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

  console.log('Starting drawing loop.  Console "clearInterval(drawInterval)" to stop.');
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

});
