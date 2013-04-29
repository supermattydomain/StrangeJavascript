(function($) {
	$(function() {
		var resizee = $('.resizable'),
			$canvas = $('#theCanvas'),
			canvas = $canvas[0],
			context = canvas.getContext('2d'),
			startStopButton = $('#startStopButton'),
			keepRunning = false,
			attractorTypes = [
				{ label: "XScreensaver 'strange' hack", clazz: XStrangeAttractor },
				{ label: "Point trail (Peter de Jong)", clazz: PointTrailAttractor }
			],
			typeSelect = $('#typeSelect'),
			attractor = new attractorTypes[0].clazz(canvas, context)
		;
		$('select').menu();
		$('button, input[type="button"]').button();
		resizee.resizable({ handles: "all", animate: false, ghost: true, autohide: false });
		resizee.on('resizestop', function(event, ui) {
			$canvas.css({ width: '100%', height: '100%' });
			canvas.width = $canvas.width();
			canvas.height = $canvas.height();
			attractor.onResize();
		});
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
				setImmediate(tick);
			}
		}
		function start() {
			keepRunning = true;
			startStopButton.val('Stop');
			setImmediate(tick);
		}
		function stop() {
			keepRunning = false;
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
