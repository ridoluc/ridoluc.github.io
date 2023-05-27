class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

class Point3D {
	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
}

class Lorenz_solver {
	constructor(
		initial_point = new Point3D(1, 1, 1),
		_rho = 28,
		_sigma = 10,
		_beta = 8 / 3
	) {
		this.param = {
			rho: _rho,
			sigma: _sigma,
			beta: _beta,
		};
		this.last_path_point = initial_point;
	}

	critical_points(param) {
		let x = Math.sqrt(this.param.beta * (this.param.rho - 1));
		let z = this.param.rho - 1;
		let p1 = new Point3D(x, x, z);
		let p2 = new Point3D(-x, -x, z);

		return [p1, p2];
	}


	Lorenz_equations(p) {
		let dx = this.param.sigma * (p.y - p.x);
		let dy = p.x * (this.param.rho - p.z) - p.y;
		let dz = p.x * p.y - this.param.beta * p.z;

		return new Point3D(dx, dy, dz);
	}

	/**
	 * ODE solver based on Runge Kutta 4th order
	 * @param {Point3D} p Three dimensional point
	 * @param {number} h step size << 1
	 */
	RungeKutta_step(p, h=0.005) {
		let p2, p3, p4;
		let k1, k2, k3, k4;

		k1 = this.Lorenz_equations(p, this.param);

		p2 = new Point3D(
			0.5 * h * k1.x + p.x,
			0.5 * h * k1.y + p.y,
			0.5 * h * k1.z + p.z
		);

		k2 = this.Lorenz_equations(p2, this.param);

		p3 = new Point3D(
			0.5 * h * k2.x + p.x,
			0.5 * h * k2.y + p.y,
			0.5 * h * k2.z + p.z
		);

		k3 = this.Lorenz_equations(p3, this.param);

		p4 = new Point3D(h * k3.x + p.x, h * k3.y + p.y, h * k3.z + p.z);

		k4 = this.Lorenz_equations(p4, this.param);

		let x = p.x + (h * (k1.x + 2 * k2.x + 2 * k3.x + k4.x)) / 6;
		let y = p.y + (h * (k1.y + 2 * k2.y + 2 * k3.y + k4.y)) / 6;
		let z = p.z + (h * (k1.z + 2 * k2.z + 2 * k3.z + k4.z)) / 6;

		return new Point3D(x, y, z);
	}

	getXZ_trajectory(n_steps = 1)
	{
		let point_list = [];

		for (let i = 0; i < n_steps; i++) {
			this.last_path_point = this.RungeKutta_step(this.last_path_point);
	
			let new_point = new Point(this.last_path_point.x, this.last_path_point.z);
	
			point_list.push(new_point);
		}
		
		return point_list;
	}
}
