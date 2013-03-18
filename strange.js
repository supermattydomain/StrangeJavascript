(function($) {
	$(function() {
		var canvas = $('#theCanvas'),
			context = canvas[0].getContext('2d'),
			imageData = context.getImageData(0, 0, canvas[0].width, canvas[0].height),
			scale = 40,
			numPoints = 1000,
			points = new RingBuffer(numPoints),
			startStopButton = $('#startStopButton'),
			timeout = undefined,
			keepRunning = false;
		// Begin with a point at (1, 1)
		points.append({x: 1, y: 1});
		function setPixel(imageData, x, y, r, g, b, a) {
			var i;
			// Put the canvas origin in the centre and zoom in
			x *= scale;
			y *= scale;
			x += canvas[0].width / 2;
			y += canvas[0].height / 2;
			x = Math.floor(x);
			y = Math.floor(y);
			i = (y * imageData.width * 4) + (x * 4);
			imageData.data[i + 0] = r;
			imageData.data[i + 1] = g;
			imageData.data[i + 2] = b;
			imageData.data[i + 3] = a;
		}
		function iteratePoint(p) {
			var params = { a: -0.89567065, b:  1.59095860, c:  1.8515863, d:  2.197430600 };
			return {
				x: Math.sin(params.a * p.y) - Math.cos(params.b * p.x),
				y: Math.sin(params.c * p.x) - Math.cos(params.d * p.y)
			};
		}
		function tick() {
			var p, colour;
			if (points.isFull()) {
				// Erase oldest point, which is about to be over-written
				p = points.get(0);
				setPixel(imageData, p.x, p.y, 0, 0, 0, 0);
			}
			// Retrieve current point
			p = points.get(points.getLength() - 1);
			// Generate colour of next point from current point's x co-ordinate
			colour = hsv2rgb(360 * p.x, 0.8, 1);
			// debug(p.x + ' => ' + colour);
			// Generate co-ordinates of next point from those of current point
			p = iteratePoint(p);
			// Add next point to list
			points.append(p);
			// Draw next point
			setPixel(imageData, p.x, p.y, colour[0], colour[1], colour[2], 255);
			// FIXME: Specifying a dirty rectangle like the below doesn't work in Chrome
			// context.putImageData(imageData, 0, 0, p.x, p.y, 1, 1);
			context.putImageData(imageData, 0, 0);
			// Arrange for next tick call to be made as soon as possible.
			// TODO: Apparently we can get true 0 timeouts by using window.postMessage.
			if (keepRunning) { 
				timeout = setTimeout(tick, 0);
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
	});
})(jQuery);
