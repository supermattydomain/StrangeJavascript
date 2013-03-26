function PointTrailAttractor(canvas, context) {
	Attractor.apply(this, arguments);
	this.imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
	this.points = new RingBuffer(this.numPoints);
	// Begin with a point at (1, 1)
	this.points.append({x: 1, y: 1});
}

PointTrailAttractor.prototype = new Attractor();
$.extend(PointTrailAttractor.prototype, {
	scale : 80,
	numPoints : 500,
	iteratePoint : function(x, y) {
		return {
			x: Math.sin(-0.89567065 * y) - Math.cos(1.59095860 * x),
			y: Math.sin(1.8515863 * x) - Math.cos(2.197430600 * y)
		};
	},
	tick : function() {
		var p, row, col, colour;
		if (this.points.isFull()) {
			// Erase oldest point, which is about to be over-written
			p = this.points.get(0);
			row = Math.floor(p.y * this.scale + this.canvas.height / 2);
			col = Math.floor(p.x * this.scale + this.canvas.width / 2);
			setPixel(this.imageData, col, row, 0, 0, 0, 255);
			this.context.putImageData(this.imageData, 0, 0, col, row, 1, 1);
		}
		// Retrieve current point
		p = this.points.get(this.points.getLength() - 1);
		// Generate colour of next point from current point's x co-ordinate
		colour = hsv2rgb(360 * p.x, 0.8, 1);
		// debug(p.x + ' => ' + colour);
		// Generate co-ordinates of next point from those of current point
		p = this.iteratePoint(p.x, p.y);
		// Add next point to list
		this.points.append(p);
		// Draw next point. Put the canvas origin in the centre and zoom in
		row = Math.floor(p.y * this.scale + this.canvas.height / 2);
		col = Math.floor(p.x * this.scale + this.canvas.width / 2);
		setPixel(this.imageData, col, row, colour[0], colour[1], colour[2], 255);
		this.context.putImageData(this.imageData, 0, 0, col, row, 1, 1);
	},
	onResize: function() {
		this.imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
	}
});
