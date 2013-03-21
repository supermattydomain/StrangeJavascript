(function($) {
	$(function() {
		var canvas = $('#theCanvas')[0],
			context = canvas.getContext('2d'),
			imageData = context.getImageData(0, 0, canvas.width, canvas.height),
			scale = 40,
			numPoints = 1000,
			points = new RingBuffer(numPoints),
			startStopButton = $('#startStopButton'),
			timeout = undefined,
			keepRunning = false;
		// Begin with a point at (1, 1)
		points.append({x: 1, y: 1});
		function setPixel(imageData, col, row, r, g, b, a) {
			var i = (row * imageData.width + col) * 4;
			imageData.data[i + 0] = r;
			imageData.data[i + 1] = g;
			imageData.data[i + 2] = b;
			imageData.data[i + 3] = a;
		}
		function iteratePoint(x, y) {
			return {
				x: Math.sin(-0.89567065 * y) - Math.cos(1.59095860 * x),
				y: Math.sin(1.8515863 * x) - Math.cos(2.197430600 * y)
			};
		}
		function tick() {
			var p, row, col, colour;
			if (points.isFull()) {
				// Erase oldest point, which is about to be over-written
				p = points.get(0);
				row = Math.floor(p.y * scale + canvas.height / 2);
				col = Math.floor(p.x * scale + canvas.width / 2);
				setPixel(imageData, col, row, 0, 0, 0, 255);
				context.putImageData(imageData, 0, 0, col, row, 1, 1);
			}
			// Retrieve current point
			p = points.get(points.getLength() - 1);
			// Generate colour of next point from current point's x co-ordinate
			colour = hsv2rgb(360 * p.x, 0.8, 1);
			// debug(p.x + ' => ' + colour);
			// Generate co-ordinates of next point from those of current point
			p = iteratePoint(p.x, p.y);
			// Add next point to list
			points.append(p);
			// Draw next point. Put the canvas origin in the centre and zoom in
			row = Math.floor(p.y * scale + canvas.height / 2);
			col = Math.floor(p.x * scale + canvas.width / 2);
			setPixel(imageData, col, row, colour[0], colour[1], colour[2], 255);
			context.putImageData(imageData, 0, 0, col, row, 1, 1);
			// Arrange for next tick call to be made as soon as possible.
			if (keepRunning) { 
				timeout = setZeroTimeout(tick);
			}
		}
		function start() {
			keepRunning = true;
			startStopButton.val('Stop');
			timeout = setTimeout(tick, 0);
		}
		function stop() {
			keepRunning = false;
			clearTimeout(timeout);
			timeout = undefined;
			startStopButton.val('Start');
		}
		function toggleRunning() {
			if (keepRunning) {
				stop();
			} else {
				start();
			}
		}
		startStopButton.on('click', toggleRunning);
		var attractor = new StrangeAttractor(canvas);
		var drawXStrangeButton = $('#drawXStrangeButton');
		drawXStrangeButton.on('click', function() {
			context.clearRect(0, 0, canvas.width, canvas.height);
			attractor.drawFrame();
		});
	});
})(jQuery);
