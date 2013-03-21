function Attractor(canvas, context) {
	this.canvas = canvas;
	this.context = context || (this.canvas ? this.canvas.getContext('2d') : null);
}
