(function($) {
	$(function() {
		var canvas = $('#theCanvas')[0],
			context = canvas.getContext('2d'),
			startStopButton = $('#startStopButton'),
			timeout = undefined,
			keepRunning = false,
			attractorTypes = [
				{ label: "XScreensaver 'strange' hack", clazz: XStrangeAttractor },
				{ label: "Point trail", clazz: PointTrailAttractor }
			],
			typeSelect = $('#typeSelect'),
			attractor = new attractorTypes[0].clazz(canvas, context);
		$(attractorTypes).each(function(i, type) {
			var option = $('<option>');
			option.text(type.label);
			option.val(i);
			typeSelect.append(option);
		});
		function tick() {
			attractor.tick();
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
		typeSelect.on('change', function() {
			stop();
			context.clearRect(0, 0, canvas.width, canvas.height);
			attractor = new attractorTypes[+$(this).val()].clazz(canvas, context);
		});
	});
})(jQuery);
