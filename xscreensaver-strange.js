var canvas, context;
var MAX_PRM = 3 * 5;
var UNIT = (1 << 12);
var UNIT2 = (1 << 14);
var SKIP_FIRST = 100;
var MAX_POINTS = 2000;

// FIXME: Insert translated definition of this macro from xscreensaver source here
function MI_NPIXELS() {
	return canvas.width;
}

function setPixel(imageData, x, y, r, g, b, a) {
	var i = (Math.floor(y) * imageData.width * 4) + (Math.floor(x) * 4);
	imageData.data[i + 0] = r;
	imageData.data[i + 1] = g;
	imageData.data[i + 2] = b;
	imageData.data[i + 3] = a;
}

function XPoint(x, y) {
	this.x = x || 0;
	this.y = y || 0;
}

function XDrawPoints(pointArr, numPoints)
{
	var i, imageData;
	if (numPoints > pointArr.length) {
		throw "numPoints " + numPoints + " out of range [0.." + pointArr.length + "]";
	}
	imageData = context.getImageData(0, 0, canvas.width, canvas.height);
	for (i = 0; i < numPoints; i++) {
		setPixel(imageData, pointArr[i].x, pointArr[i].y, 255, 255, 255, 255);
	}
	context.putImageData(imageData, 0, 0);
}

function Attractor() {
    this.Prm = calloc_var(MAX_PRM);
    this.Prm1 = calloc_var(MAX_PRM);
    this.Prm2 = calloc_var(MAX_PRM);
}

$.extend(Attractor.prototype, {
    Fold: null,
    Iterate: null,
    Buffer1: null,
    Buffer2: null,
    Cur_Pt: null,
    Max_Pt: null,
    Col: null,
    Count: null,
    Speed: null,
    Width: null,
    Height: null,
    dbuf: null
});

var Root = new Attractor();

var Amp_Prm = [ 1.0, 3.5, 3.5, 2.5, 4.7, 1.0, 3.5, 3.6, 2.5, 4.7, 1.0, 1.5,
		2.2, 2.1, 3.5 ];
var Mid_Prm = [ 0.0, 1.5, 0.0, 0.5, 1.5, 0.0, 1.5, 0.0, 0.5, 1.5, 0.0, 1.5,
		-1.0, -0.5, 2.5 ];

// FIXME: random() range: [0..RAND_MAX ]) <-- ???
// On Linux x86, RAND_MAX is 0x7fffffff
// Math.random range: [0..1)
// FIXME: If above is correct, the below might simplify.
// But beware bit operations, as Javascript is using floats/doubles here.
function LRAND() {
	return ((Math.random() * 0x7fffffff) & 0x7fffffff);
}
function NRAND(n) {
	return LRAND() % n;
}
var MAXRAND = 1 << 31; /* unsigned 1<<31 as a float */

function DBL_To_PRM(x) {
	return UNIT * x;
}

function Gauss_Rand(c, A, S) {
	var y;

	y = LRAND() / MAXRAND;
	y = A * (1.0 - Math.exp(-y * y * S)) / (1.0 - Math.exp(-S));
	if (NRAND(2)) {
		return (c + y);
	} else {
		return (c - y);
	}
}

function Random_Prm(Prm) {
	var i;
	for (i = 0; i < MAX_PRM; ++i) {
		Prm[i] = Gauss_Rand(Mid_Prm[i], Amp_Prm[i], 4.0);
	}
}

function DO_FOLD(Att, a) {
	return (a) < 0 ? -Att.Fold[-a & (UNIT2 - 1)] : Att.Fold[a & (UNIT2 - 1)];
}

function Iterate_X2(A, x, y) {
	var xx, yy, xy, x2y, y2x, Tmp, xo, yo;

	xx = (x * x) / UNIT;
	x2y = (xx * y) / UNIT;
	yy = (y * y) / UNIT;
	y2x = (yy * x) / UNIT;
	xy = (x * y) / UNIT;

	Tmp = A.Prm[1] * xx + A.Prm[2] * xy + A.Prm[3] * yy
			+ A.Prm[4] * x2y;
	Tmp = A.Prm[0] - y + (Tmp / UNIT);
	xo = DO_FOLD(A, Tmp);
	Tmp = A.Prm[6] * xx + A.Prm[7] * xy + A.Prm[8] * yy
			+ A.Prm[9] * y2x;
	Tmp = A.Prm[5] + x + (Tmp / UNIT);
	yo = DO_FOLD(A, Tmp);
	return {
		x : xo,
		y : yo
	};
}

function Iterate_X3(A, x, y) {
	var xx, yy, xy, x2y, y2x, Tmp_x, Tmp_y, Tmp_z, xo, yo;

	xx = (x * x) / UNIT;
	x2y = (xx * y) / UNIT;
	yy = (y * y) / UNIT;
	y2x = (yy * x) / UNIT;
	xy = (x * y) / UNIT;

	Tmp_x = A.Prm[1] * xx + A.Prm[2] * xy + A.Prm[3]
			* yy + A.Prm[4] * x2y;
	Tmp_x = A.Prm[0] - y + (Tmp_x / UNIT);
	Tmp_x = DO_FOLD(A, Tmp_x);

	Tmp_y = A.Prm[6] * xx + A.Prm[7] * xy + A.Prm[8]
			* yy + A.Prm[9] * y2x;
	Tmp_y = A.Prm[5] + x + (Tmp_y / UNIT);

	Tmp_y = DO_FOLD(A, Tmp_y);

	Tmp_z = A.Prm[11] * xx + A.Prm[12] * xy + A.Prm[13]
			* yy + A.Prm[14] * y2x;
	Tmp_z = A.Prm[10] + x + (Tmp_z / UNIT);
	Tmp_z = UNIT + Tmp_z * Tmp_z / UNIT;

	xo = (Tmp_x * UNIT) / Tmp_z;
	yo = (Tmp_y * UNIT) / Tmp_z;
	return {
		x : xo,
		y : yo
	};
}

var Funcs = [ Iterate_X2, Iterate_X3 ];

function draw_strange() {
	var i, j, n, Cur_Pt;
	var x, y, out, xo, yo, u;
	var Buf;
	var Lx, Ly;
	var Iterate;
	var xmin, xmax, ymin, ymax;
	var A;

	A = Root;
	if (!A.Fold) {
		return;
	}

	Cur_Pt = A.Cur_Pt;
	Iterate = A.Iterate;

	u = A.Count / 1000.0;
	for (j = MAX_PRM - 1; j >= 0; --j) {
		A.Prm[j] = DBL_To_PRM((1.0 - u) * A.Prm1[j] + u * A.Prm2[j]);
	}

	x = y = DBL_To_PRM(0);
	for (n = SKIP_FIRST; n; --n) {
		out = Iterate(A, x, y);
		xo = out.x;
		yo = out.y;
		x = xo + NRAND(8) - 4;
		y = yo + NRAND(8) - 4;
	}

	xmax = 0;
	xmin = UNIT * 4;
	ymax = 0;
	ymin = UNIT * 4;
	A.Cur_Pt = 0;
	Buf = A.Buffer2;
	BufIdx = 0;
	Lx = A.Width / UNIT / 2.2;
	Ly = A.Height / UNIT / 2.2;
	for (n = A.Max_Pt; n; --n) {
		out = Iterate(A, x, y);
		xo = out.x;
		yo = out.y;
		Buf[BufIdx].x = (Lx * (x + DBL_To_PRM(1.1)));
		Buf[BufIdx].y = (Ly * (DBL_To_PRM(1.1) - y));
		// debug("X,Y: ", Buf[BufIdx].x, Buf[BufIdx].y);
		BufIdx++;
		A.Cur_Pt++;
		if (xo > xmax) {
			xmax = xo;
		} else if (xo < xmin) {
			xmin = xo;
		}
		if (yo > ymax) {
			ymax = yo;
		} else if (yo < ymin) {
			ymin = yo;
		}
		x = xo + NRAND(8) - 4;
		y = yo + NRAND(8) - 4;
	}

	// TODO: XSetForeground(cols[col].pixel);
	// Draw arrays of points
	XDrawPoints(A.Buffer1, Cur_Pt);
	XDrawPoints(A.Buffer2, A.Cur_Pt);

	Buf = A.Buffer1;
	A.Buffer1 = A.Buffer2;
	A.Buffer2 = Buf;

	if ((xmax - xmin < DBL_To_PRM(0.2)) && (ymax - ymin < DBL_To_PRM(0.2))) {
		A.Count += 4 * A.Speed;
	} else {
		A.Count += A.Speed;
	}
	if (A.Count >= 1000) {
		for (i = MAX_PRM - 1; i >= 0; --i) {
			A.Prm1[i] = A.Prm2[i];
		}
		Random_Prm(A.Prm2);
		A.Count = 0;
	}
	A.Col++;
}

function init_strange(theCanvas) {
	var i, x, A;
	
	canvas = theCanvas;
	context = canvas.getContext('2d');
	if (!Root) {
		Root = new Attractor();
	}
	A = Root;

	if (!A.Fold) {
		A.Fold = calloc_var(UNIT2 + 1);
		for (i = 0; i <= UNIT2; ++i) {
			/* x = ( DBL )(i)/UNIT2; */
			/* x = sin( M_PI/2.0*x ); */
			/* x = sqrt( x ); */
			/* x = x*x; */
			/* x = x*(1.0-x)*4.0; */
			x = i / UNIT;
			x = Math.sin(x);
			A.Fold[i] = DBL_To_PRM(x);
		}
	}
	A.Max_Pt = MAX_POINTS;
	if (!A.Buffer1) {
		A.Buffer1 = calloc(A.Max_Pt, XPoint);
	}
	if (!A.Buffer2) {
		A.Buffer2 = calloc(A.Max_Pt, XPoint);
	}
	A.Width = canvas.width;
	A.Height = canvas.height;
	A.Cur_Pt = 0;
	A.Count = 0;
	A.Col = NRAND(MI_NPIXELS());
	A.Speed = 4;

	A.Iterate = Funcs[NRAND(2)];
	Random_Prm(A.Prm1);
	Random_Prm(A.Prm2);
}
