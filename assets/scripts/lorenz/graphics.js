class SVG_Graphics {
	constructor(svg_context) {
		this._svg_ = svg_context;

		this.scale = { x: 9, y: 9 };
		this.translate = { x: 340, y: 30 };

		this.svgPath = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"path"
		);
		this.svgPath.setAttribute("fill", "none");
		this.svgPath.setAttribute("stroke", "#4e97ff");
		this.svgPath.setAttribute("stroke-width", "0.6");
		this.svgPath.setAttribute("id", "Lorenz-path");
		this._svg_.appendChild(this.svgPath);
	}

	transform_point(point) {
		return {
			x: point.x * this.scale.x + this.translate.x,
			y: point.y * this.scale.y + this.translate.y,
		};
	}

	draw_points(points, st) {
		for (let i = 0; i < points.length; i++) {
			points[i] = this.transform_point(points[i]);
		}

		let r = 2;
		let txt = "";

		for (const p of points) {
			txt +=
				"<circle cx=" + p.x + " cy=" + p.y + " r=" + r + "></circle>";
		}

		let point_group = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"g"
		);
		point_group.setAttribute("style", st);

		point_group.innerHTML = txt;
		this._svg_.appendChild(point_group);
	}

	append_path(points) {
		for (let i = 0; i < points.length; i++) {
			points[i] = this.transform_point(points[i]);
		}

		var pathData = this.svgPath.getAttribute("d");

		if (pathData === "" || pathData == null) {
			pathData = "M" + points[0].x + "," + points[0].y;
		}
		for (const e of points) {
			pathData +=  "T"+ e.x + "," + e.y + " ";
		}

		this.svgPath.setAttribute("d", pathData);
	}
}
