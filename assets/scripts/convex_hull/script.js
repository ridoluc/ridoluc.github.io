var points = [];

var gr, _svg_;



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
	} while (new_end != hull[0]);

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

function create_edges(p_list) {
	let edges = [];
	let last_point = p_list[0];

	for (let i = 1; i < p_list.length; i++) {
		edges.push(new Edge(last_point, p_list[i]));
		last_point = p_list[i];
	}

	edges.push(new Edge(last_point, p_list[0]));
	return edges;
}

function update() {
	let t0,t1;

	t0 = performance.now();
	let hull = convexHull(points);
	t1 = performance.now();

	let edges = create_edges(hull);

	gr.draw(points, [], edges);
	document.getElementById("timer").innerText = (t1 - t0).toFixed(2) + " ms"
}

function addPoint(e) {
	let x = e.offsetX;
	let y = e.offsetY;
	/* Add point */
	let add = true;
	for (const p of points) {
		let d = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
		if (d < 3) add = false;
	}
	if (add) points.push(new Point(x, y));

	// gr.draw(points, [], []);
	update();
}

function reset() {
	points = [];
	gr.draw(points, [], []);
}

function generate() {
	let N = parseInt(document.getElementById("generate-text").value);
	points = generatePoints(N);
	update();
}

function generatePoints(N) {
	let W = _svg_.width.baseVal.value * 0.99;
	let H = _svg_.height.baseVal.value * 0.99;

	let points = [];
	for (i = 0; i < N; i++) {
		var pt = new Point(Math.random() * W, Math.random() * H, 2);
		points.push(pt);
	}

	return points;
}

class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

class Edge {
	constructor(start, end) {
		this.start = start;
		this.end = end;
	}
}




var ctx = document.getElementById("compchart");
var color = Chart.helpers.color;
var myChart = new Chart(ctx, {
	type: "line",
	data: {
		datasets: [
			{
                pointStyle:"rect",
                pointRadius:2,
                pointBackgroundColor:"#262C40",
                borderColor:"#262C40",
                lineTension:0,
                borderWidth:1,
                fill:false,
				data: [
					{x: 4, y: 0.020324999786680564}
                    ,{x: 8, y: 0.016449999529868364}
                    ,{x: 16, y: 0.011375001195119694}
                    ,{x: 32, y: 0.01537500022095628}
                    ,{x: 64, y: 0.03232500224839896}
                    ,{x: 128, y: 0.07107499928679317}
                    ,{x: 256, y: 0.15709999890532345}
                    ,{x: 512, y: 0.3275499996379949}
                    ,{x: 1024, y: 0.6925750014488585}
                    ,{x: 2048, y: 1.5095999994082376}
                    , {x: 4096, y: 3.2347749994369224}
                    , {x: 8192, y: 7.1417250006925315}
                    , {x: 16384, y: 15.537500000500586}
                    , {x: 32768, y: 32.29549999916344}
                    , {x: 65536, y: 72.53972500024247}
                    , {x: 131072, y: 153.1331999982649}
                    , {x: 262144, y: 326.8851750003523}
                    , {x: 524288, y: 681.8050999987463}
                    , {x: 1048576, y: 1476.6219000011915}
				],
				label: "Gift Wrapping",

			},
			{
                pointStyle:"rect",
                pointRadius:2,
                pointBackgroundColor:"#99BAD6",
                borderColor:"#99BAD6",
                borderWidth:1,
                lineTension:0,
                fill:false,
				data: [
					{x: 4, y: 0.014299999747890979}
                    ,{x: 8, y: 0.02557499843533151}
                    ,{x: 16, y: 0.04129999942961149}
                    ,{x: 32, y: 0.05794999917270616}
                    ,{x: 64, y: 0.14714999968418851}
                    ,{x: 128, y: 0.07957499852636829}
                    ,{x: 256, y: 0.09162499991361983}
                    ,{x: 512, y: 0.1606000009633135}
                    ,{x: 1024, y: 0.41682499839225784}
                    ,{x: 2048, y: 0.7528500001353677}
                    , {x: 4096, y: 1.5666500003135297}
                    , {x: 8192, y: 3.554924999625655}
                    , {x: 16384, y: 20.057850000739563}
                    , {x: 32768, y: 42.176024999207584}
                    , {x: 65536, y: 68.57587500227964}
                    , {x: 131072, y: 174.18319999807863}
                    , {x: 262144, y: 396.38914999872213}
                    , {x: 524288, y: 917.914349999628}
                    , {x: 1048576, y: 1597.5717000005534}
				],
				label: "Graham scan",

			},
		],
		
	},
	options: {
        legend:{
            usePointStyle: true,
            position: "bottom"
        },
        tooltips:{
            enabled:false},
		scales: {
			xAxes: [
				{
                    gridLines:{
                        drawTicks:false,
                        drawOnChartArea:true
                    },
                    type: "logarithmic",
                    position: 'bottom',
						ticks: {
							userCallback: function(tick) {
								var remain = tick / (Math.pow(10, Math.floor(Chart.helpers.log10(tick))));
								if (remain === 1 || remain === 2 || remain === 5) {
                                    let t = tick;
                                    if(tick>999) return(tick/1000+"k")
                                    return (tick.toString());
								}
								return '';
                            },
                            padding:10
						},
						scaleLabel: {
                            labelString: 'Number of points',
                        display: true


						}
				},
			],
			yAxes: [
				{
                    gridLines:{
                        drawTicks:false,
                        drawOnChartArea:true
                    },
                    type: "logarithmic",
                    ticks: {
							userCallback: function(tick) {
								var remain = tick / (Math.pow(10, Math.floor(Chart.helpers.log10(tick))));
								if (remain === 1 || remain === 2 || remain === 5) {
									return tick.toString() + 'ms';
								}
								return '';
                            },
                            padding:10
                            
                    },
                    scaleLabel: {
                        labelString: 'Execution time',
                        display: true
                    }
				},
			],
		},
	},
});


class SVG_Graphics {
	constructor(svg_context) {
		this._svg_ = svg_context;

		this.point_style = "fill:#b70000";
		this.line_style = "stroke: rgb(205, 207, 239);stroke-width: 1;fill: transparent";
		this.vertex_style = "stroke: black;stroke-width: 0.2;fill: transparent;";
	}


	draw_points(points, st) {

        let r = 3;
        let txt = "";

		for (const p of points) {
			txt += "<circle cx=" + p.x + " cy=" + p.y +" r=" + r +"></circle>";
        }


        let point_group = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"g"
		);
		point_group.setAttribute("style", st);
		point_group.innerHTML = txt;
		this._svg_.appendChild(point_group);

	}

	draw_lines(edges) {

		let linesSVG = "";

		for (const e of edges) {
            if(e && e.end && e.start){
			linesSVG += "<line x1=" + e.end.x + " y1=" +e.end.y +" x2=" + e.start.x + " y2=" +e.start.y+"></line>";}
		}

		let line_group = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"g"
		);
		line_group.setAttribute("style", this.line_style);
		line_group.innerHTML = linesSVG;
		this._svg_.appendChild(line_group);
	
	}

	draw(p,v,e){
		this._svg_.textContent = '';
		// gr.draw_points(v, this.vertex_style);
		this.draw_lines(e);

		this.draw_points(p,this.point_style);
	}
}

(function () {
	_svg_ = document.getElementById("svg_hull");
	gr = new SVG_Graphics(_svg_);

	document.getElementById("svg_hull").onclick = addPoint;
	document.getElementById("clear").onclick = reset;
	// document.getElementById("generate-btn").onclick = generate;

	points = generatePoints(10);
	update();
})();
