var stop = false;

let frameRate = 60; // Frame rate in frames per second
let frameInterval = 1000 / frameRate; // Interval between frames in milliseconds

var max_steps = 1500;
var steps_count = 0;

var lorenz_solver;
var gr;

(function () {
	let _svg_ = document.getElementById("svg_lorenz");

	document.getElementById("start-stop-btn").onclick = start_stop;
	document.getElementById("refresh-btn").onclick = restart;

	let initialPoint = new Point3D(1, 1, 1);
	lorenz_solver= new Lorenz_solver(initialPoint);

	let cr_points = lorenz_solver.critical_points();

	gr = new SVG_Graphics(_svg_, cr_points);

	gr.draw_points(
		[
			new Point(cr_points[0].x, cr_points[0].z),
			new Point(cr_points[1].x, cr_points[1].z),
		],
		"fill:#e42fc2"
	);

	update(lorenz_solver);
})();

function update() {

	steps_count +=1;

	let trajectory_points = lorenz_solver.getXZ_trajectory(7);

	gr.append_path(trajectory_points);

	// Schedule the next frame
	if (!stop && max_steps > steps_count) setTimeout(update, frameInterval);
}

function start_stop() {
	stop = !stop;
	if (steps_count >= max_steps) steps_count =0;
	if (!stop) update();
}

function restart() {
	gr.svgPath.setAttribute("d", "");
	let InitialPoint = new Point3D(1, 1, 1);
   lorenz_solver.last_path_point = InitialPoint;
	steps_count =0;
	update();
}
