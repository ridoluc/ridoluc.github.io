let points = [];

let vor, gr, _svg_;
let moving_point;

window.onload = function () {
	_svg_ = document.getElementById("svg_lloyd");
	
	vor = new VoronoiDiagram(
		points,
		_svg_.width.baseVal.value,
		_svg_.height.baseVal.value
	);
	gr = new SVG_Graphics(_svg_);
	
	generate();

	document.getElementById("svg_lloyd").onclick = function (event) {
		let x = event.offsetX;
		let y = event.offsetY;

		addPoint(x, y);
	};
	document.getElementById("svg_lloyd").onmousemove = highlight;
	// document.getElementById("clear").onclick = reset;
	// document.getElementById("relax-btn").onclick = relax;
	document.getElementById("generate-btn").onclick = generate;
};

function updateAll() {
	let t0 = performance.now();

	vor.update();

	let t1 = performance.now();

	gr.draw(points, vor.voronoi_vertex, vor.edges);

	document.getElementById("timer").innerText =
		(t1 - t0).toFixed(2) + " ms";

	adjustVertices();
}

function reset() {
	vor.point_list = [];
	points = [];
	_svg_.textContent = "";
}

/**
 * Lloyd's Algorithm core function. Executes one iteration per frame
 */
function relax() {
	// Animation variables
	let then = -1000,
		now;
	const fps = 60,
		fpsInterval = 1000 / fps;

	// Geometry variables
	let new_list = [],
		cost = 1000,
		c,
		done = false,
		cost_min = 0.08;

	// Lloyd's Algorithm iteration
	(function loop() {

		now = Date.now();

		// Render
		if (now - then > fpsInterval) {
			then = now;

			// Update geometry and image
			new_list = [];
			cost = 0;
			for (const p of vor.point_list) {
				c = computeCentroid(p.vertices);
				cost += pointsDist(c, p);
				new_list.push(c);
			}

			// Change sites list with centroids
			points = vor.point_list = new_list;

			updateAll();
		}
		
		// Stop the loop if the cost per cell is below a certain threshold
		done = (cost / new_list.length) < cost_min;
		if (!done)
			window.requestAnimationFrame(loop);


	})();

}

function addPoint(x,y) {
	/* Add point */
	let add = true;
	for (const p of points) {
		let d = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
		if (d < 3) add = false;
		p.vertices = [];
	}
	if (add) points.push(new Point(x, y));
	vor.point_list = points;

	updateAll();
	relax();
}

function adjustVertices() {
	let tl, tr, bl, br;
	let d_tl = Infinity,
		d_tr = Infinity,
		d_bl = Infinity,
		d_br = Infinity;
	let tmp;
	for (const p of vor.point_list) {
		// Adjust order on the hull
		if (p.vertices && p.vertices.length > 0)
			p.vertices = convexHull(p.vertices);

		// Add corners
		tmp = pointsDist(p, { x: 0, y: 0 });
		if (d_tl > tmp) {
			d_tl = tmp;
			tl = p;
		}
		tmp = pointsDist(p, { x: _svg_.width.baseVal.value, y: 0 });
		if (d_tr > tmp) {
			d_tr = tmp;
			tr = p;
		}
		tmp = pointsDist(p, { x: 0, y: _svg_.height.baseVal.value });
		if (d_bl > tmp) {
			d_bl = tmp;
			bl = p;
		}
		tmp = pointsDist(p, {
			x: _svg_.width.baseVal.value,
			y: _svg_.height.baseVal.value,
		});
		if (d_br > tmp) {
			d_br = tmp;
			br = p;
		}
	}

	tl.vertices.push(new Point(0, 0));
	tl.vertices = convexHull(tl.vertices);
	tr.vertices.push(new Point(_svg_.width.baseVal.value, 0));
	tr.vertices = convexHull(tr.vertices);
	bl.vertices.push(new Point(0, _svg_.height.baseVal.value));
	bl.vertices = convexHull(bl.vertices);
	br.vertices.push(
		new Point(_svg_.width.baseVal.value, _svg_.height.baseVal.value)
	);
	br.vertices = convexHull(br.vertices);
}

/**
 * Genarate points taking input from the html element and updates geometry and graphics
 */
function generate() {
	let N = parseInt(document.getElementById("generate-text").value);
	let W = _svg_.width.baseVal.value * 0.99;
	let H = _svg_.height.baseVal.value * 0.99;

	points = generatePoints(N,W,H);
	vor.point_list = points;

	updateAll();
	relax();
}

/**
 * Generate a list of N points 
 * @param {Int} N - Number of points 
 * @param {Int} W - Width of canvas in pixels
 * @param {Int} H - Height of canvas	
 */
function generatePoints(N,W,H) {
	let r,th;
	let points = [];
	for (i = 0; i < N; i++) {
		r=Math.random() * 50;
		th = 2*Math.random() * Math.PI;

		var pt = new Point(W/2 + r*Math.cos(th), H/2 + r*Math.sin(th));
		var good = true;
		for (const p of points) {
			let dist = pointsDist(pt, p);
			if (dist < 0.5) {
				good = false;
				break;
			}
		}
		good ? points.push(pt) : i--;
	}

	return points;
}


function highlight(event) {
	let x = event.offsetX;
	let y = event.offsetY;

	let p = find_site(x, y);
    if(p)gr.draw_polygon(p.vertices);
}

function find_site(x, y) {
	let min = Infinity;
	let min_p;
	let d;

	for (const p of vor.point_list) {
		d = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
		if (d < min) {
			min = d;
			min_p = p;
		}
	}
	return min_p;
}

function pointsDist(p1, p2) {
	return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/**
 * Computes the centroid of a polygon given its vertices
 * @param {[Point]} vertices - List of points representing the convex hull of a polygon
 */
function computeCentroid(vertices) {
	let v = Array.from(vertices);
	v.push(v[0]);

	let cx = 0,
		cy = 0,
		A = 0,
		tmp = 0;

	for (let i = 0; i < v.length - 1; i++) {
		tmp = v[i].x * v[i + 1].y - v[i + 1].x * v[i].y;
		cx += (v[i].x + v[i + 1].x) * tmp;
		cy += (v[i].y + v[i + 1].y) * tmp;
		A += tmp;
	}

	A *= 0.5;
	cx /= 6 * A;
	cy /= 6 * A;

	return new Point(cx, cy);
}

/**
 * From a list of points on a plane returns an ordered sequence of points on the hull
 * @param {Object[]} p_list - List of Points. Each element must have x and y properties
 * @returns {Object[]}
 */
function convexHull(p_list) {
	if (p_list.length < 3) return p_list;

	let hull = [];
	let tmp;

	// Find leftmost point
	tmp = p_list[0];
	for (const p of p_list) if (p.x < tmp.x) tmp = p;

	hull[0] = tmp;

	let endpoint, secondlast;
	let min_angle, new_end;

	endpoint = hull[0];
	secondlast = new Point(endpoint.x, endpoint.y + 10);

    let time = 0;
	do {
		min_angle = Math.PI; // Initial value. Any angle must be lower that 2PI
		for (const p of p_list) {
			tmp = polarAngle(secondlast, endpoint, p);

			if (tmp <= min_angle) {
				new_end = p;
				min_angle = tmp;
			}
		}

		if (new_end != hull[0]) {
			hull.push(new_end);
			secondlast = endpoint;
			endpoint = new_end;
        }
        time++;
	} while (new_end !== hull[0] && time <10);

	return hull;
}

/**
 * Calculate the angle between two segments identified by three points
 * @param {Point} a - Point connected to a middle point
 * @param {Point} b - Middle point
 * @param {Point} c - Point connected to a middle point
 */
function polarAngle(a, b, c) {
	let x = (a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y);
	let y = (a.x - b.x) * (c.y - b.y) - (c.x - b.x) * (a.y - b.y);
	return Math.atan2(y, x);
}
