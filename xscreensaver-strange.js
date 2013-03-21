function RainbowColourMap(size) {
	var i, hsb;
	for (i = 0; i < size; i++) {
		hsb = new HSBColour(360 * i / size, 1.0, 1.0);
		this.colours[i] = hsb.toRGB();
	}
}

RainbowColourMap.prototype = new Array();
$.extend(RainbowColourMap.prototype, {
	colours: []
});

function setPixel(imageData, x, y, r, g, b) {
	var i = (Math.floor(y) * imageData.width * 4) + (Math.floor(x) * 4);
	imageData.data[i + 0] = r;
	imageData.data[i + 1] = g;
	imageData.data[i + 2] = b;
	imageData.data[i + 3] = 255;
}

function XPoint(x, y) {
	this.x = x || 0;
	this.y = y || 0;
}

function StrangeAttractor(canvas) {
	var i, x;
	this.canvas = canvas;
	this.context = this.canvas.getContext('2d');
	this.width = canvas.width;
	this.height = canvas.height;
	this.randomiseParams(this.params1);
	this.randomiseParams(this.params2);
	this.iterateFunctions = [ this.iterateX2, this.iterateX3 ];
	this.iterate = this.iterateFunctions[this.nrand(this.iterateFunctions.length)];
	this.colourMap = new RainbowColourMap(this.numColours);
	this.currentColourIndex = this.nrand(this.colourMap.colours.length);
	this.pointBuf1 = calloc(this.maxPoints, XPoint);
	this.pointBuf2 = calloc(this.maxPoints, XPoint);
	for (i = 0; i <= this.unit2; ++i) {
		/* x = ( DBL )(i)/UNIT2; */
		/* x = sin( M_PI/2.0*x ); */
		/* x = sqrt( x ); */
		/* x = x*x; */
		/* x = x*(1.0-x)*4.0; */
		x = Math.sin(i / this.unit);
		this.fold[i] = x * this.unit;
	}
}

$.extend(StrangeAttractor.prototype, {
	currentPointIndex : 0,
	count : 0,
	unit : (1 << 12),
	unit2 : (1 << 14),
	speed : 4,
	numColours : 64,
	skipFirst : 100,
	maxPoints : 2000,
	maxParams : 3 * 5,
	params : [],
	params1 : [],
	params2 : [],
	fold : [],
	ampPrm : [ 1.0, 3.5, 3.5, 2.5, 4.7, 1.0, 3.5, 3.6, 2.5, 4.7, 1.0, 1.5,
			2.2, 2.1, 3.5 ],
	midPrm : [ 0.0, 1.5, 0.0, 0.5, 1.5, 0.0, 1.5, 0.0, 0.5, 1.5, 0.0, 1.5,
			-1.0, -0.5, 2.5 ],
	nrand : function(n) {
		return Math.floor(Math.random() * 0x7fffffff) % n;
	},
	gaussianRandom : function(c, A, S) {
		var y;

		y = Math.random();
		y = A * (1.0 - Math.exp(-y * y * S)) / (1.0 - Math.exp(-S));
		if (this.nrand(2)) {
			return (c + y);
		}
		return (c - y);
	},
	randomiseParams : function(params) {
		var i;
		for (i = 0; i < this.maxParams; ++i) {
			params[i] = this.gaussianRandom(this.midPrm[i], this.ampPrm[i], 4.0);
		}
	},
	doFold : function(a) {
		return a < 0 ? -this.fold[-a & (this.unit2 - 1)] : this.fold[a & (this.unit2 - 1)];
	},
	iterateX2 : function(x, y) {
		var xx, yy, xy, x2y, y2x;

		xx = (x * x) / this.unit;
		x2y = (xx * y) / this.unit;
		yy = (y * y) / this.unit;
		y2x = (yy * x) / this.unit;
		xy = (x * y) / this.unit;

		return {
			x : this.doFold(this.params[0] - y + ((this.params[1] * xx + this.params[2] * xy + this.params[3] * yy + this.params[4] * x2y) / this.unit)),
			y : this.doFold(this.params[5] + x + ((this.params[6] * xx + this.params[7] * xy + this.params[8] * yy + this.params[9]
			* y2x) / this.unit))
		};
	},
	iterateX3 : function(x, y) {
		var xx, yy, xy, x2y, y2x, Tmp_x, Tmp_y, Tmp_z;

		xx = (x * x) / this.unit;
		x2y = (xx * y) / this.unit;
		yy = (y * y) / this.unit;
		y2x = (yy * x) / this.unit;
		xy = (x * y) / this.unit;

		Tmp_x = this.params[1] * xx + this.params[2] * xy + this.params[3] * yy
				+ this.params[4] * x2y;
		Tmp_x = this.doFold(this.params[0] - y + (Tmp_x / this.unit));

		Tmp_y = this.params[6] * xx + this.params[7] * xy + this.params[8] * yy
				+ this.params[9] * y2x;
		Tmp_y = this.doFold(this.params[5] + x + (Tmp_y / this.unit));

		Tmp_z = this.params[11] * xx + this.params[12] * xy + this.params[13] * yy
				+ this.params[14] * y2x;
		Tmp_z = this.params[10] + x + (Tmp_z / this.unit);
		Tmp_z = this.unit + Tmp_z * Tmp_z / this.unit;

		return {
			x : (Tmp_x * this.unit) / Tmp_z,
			y : (Tmp_y * this.unit) / Tmp_z
		};
	},
	drawPoints : function(pointArr, numPoints) {
		var i, imageData;
		var top = 0, left = 0, width = this.canvas.width, height = this.canvas.height;
		var colour = this.colourMap.colours[this.currentColourIndex % this.colourMap.colours.length];
		imageData = this.context.getImageData(left, top, width, height);
		for (i = 0; i < numPoints; i++) {
			setPixel(imageData, pointArr[i].x, pointArr[i].y, colour.r, colour.g,
					colour.b);
		}
		this.context.putImageData(imageData, left, top);
	},
	drawFrame : function() {
		var i, currentPointIndex = this.currentPointIndex;
		var x = 0, y = 0, out, u = this.count / 1000.0;
		var tmp, BufIdx = 0;
		var xmin = ymin = this.unit * 4, xmax = ymax = 0;

		for (i = this.maxParams - 1; i >= 0; --i) {
			this.params[i] = this.unit * ((1.0 - u) * this.params1[i] + u * this.params2[i]);
		}

		for (i = this.skipFirst; i; --i) {
			out = this.iterate(x, y);
			x = out.x + this.nrand(8) - 4;
			y = out.y + this.nrand(8) - 4;
		}

		this.currentPointIndex = 0;
		for (i = this.maxPoints; i; --i) {
			out = this.iterate(x, y);
			assert(function() { BufIdx === this.currentPointIndex; });
			this.pointBuf2[BufIdx].x = (this.width / this.unit / 2.2 * (out.x + this.unit * 1.1));
			this.pointBuf2[BufIdx].y = (this.height / this.unit / 2.2 * (this.unit * 1.1 - out.y));
			// debug("X,Y: ", Buf[BufIdx].x, Buf[BufIdx].y);
			BufIdx++;
			this.currentPointIndex++;
			xmin = Math.min(xmin, out.x);
			xmax = Math.max(xmax, out.x);
			ymin = Math.min(ymin, out.y);
			ymax = Math.max(ymax, out.y);
			x = out.x + this.nrand(8) - 4;
			y = out.y + this.nrand(8) - 4;
		}

		this.drawPoints(this.pointBuf1, currentPointIndex);
		this.drawPoints(this.pointBuf2, this.currentPointIndex);

		tmp = this.pointBuf1;
		this.pointBuf1 = this.pointBuf2;
		this.pointBuf2 = tmp;

		if ((xmax - xmin < this.unit * 0.2) && (ymax - ymin < this.unit * 0.2)) {
			this.count += 4 * this.speed;
		} else {
			this.count += this.speed;
		}
		if (this.count >= 1000) {
			this.params1 = this.params2;
			this.params2 = [];
			this.randomiseParams(this.params2);
			this.count = 0;
		}
		this.currentColourIndex++;
	}
});
