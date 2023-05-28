---
layout: post
title: "Lorenz Attractors"
description: "Simulation of Lorenz attractors with fourth-order Runge Kutta numerical solution"
date: 2023-05-26 12:00:00 +0000
tags: algorithms graphics
#slug: "--"
usemathjax: true
featured_img: "/assets/img/lorenz/lorenz-attractor.png"
---

Numerical solution of the Lorenz system, a set of ordinary differential equations known for their chaotic behavior. Simulation of the chaotic solutions, also referred to as the Lorenz Attractror, using the Runge-Kutta method.
<!-- excer -->
{: .abstr}

<div style="margin: 50px auto;">
    <svg style="min-width: 100%;height: 500px;border: 1px solid #dcdcdc;" xmlns="http://www.w3.org/2000/svg" id="svg_lorenz"></svg>
    <div class="row" style="font-size: 1.2rem;">
        <div class="six columns" >
        <p style="margin-bottom: 3px">Lorenz attractor with parameters sigma = 10, beta = 8/3 and rho=28 viewed from the Y-Z plane</p>
        </div>
        <div class="three columns">
            <input type="button" class="btn-control u-pull-right" id="start-stop-btn" value="Start/Stop">
        </div>
         <div class="three columns">
            <input type="button" class="btn-control u-pull-right" id="refresh-btn" value="Restart">
        </div>
    </div>
    <script src="/assets/scripts/lorenz/graphics.js"></script>
    <script src="/assets/scripts/lorenz/Lorenz.js"></script>
    <script src="/assets/scripts/lorenz/main.js"></script>
</div>

## Introduction
The Lorenz system[^1], named after mathematician Edward Lorenz, is a set of differential equations that exhibit complex and chaotic behaviour. Originally introduced in the 1960s to study atmospheric convection, the Lorenz system has since become a cornerstone of chaos theory and has found applications in various scientific disciplines. This article presents a straightforward approach to solving the Lorenz system of differential equations through the utilization of a fourth-order Runge-Kutta algorithm for numerical approximation.


## The Lorenz System
The Lorenz system is described by three coupled nonlinear differential equations:

$$
\frac{dx}{dt} = \sigma(y - x)
$$

$$
\frac{dy}{dt} = x(\rho - z) - y
$$

$$
\frac{dz}{dt} = xy - \beta 
$$

Here, x, y, and z represent the state variables, and σ, ρ, and β are system parameters. The dynamics of the system depend on these parameters, and different values can lead to distinct behaviours. 

The Lorenz system is known for its chaotic behaviour exhibiting sensitive dependence on initial conditions. This means that even slight variations in the initial conditions can lead to vastly different trajectories over time. 

This ODE system found applications across various scientific fields including atmospheric modelling, chaos theory, and cryptography and the equations often arise in simple models for lasers, electronic circuits and chemical reactions.

### The Lorenz Attractor:
For certain parameter values, the trajectories of the system do not settle into stable fixed points or periodic orbits[^2]. Instead, they exhibit irregular and unpredictable motion within a confined region of phase space. These irregular patterns are known as strange attractors. There are several known strange attractors like [double-scroll attractor](https://en.wikipedia.org/wiki/Multiscroll_attractor), [Rössler attractor](https://en.wikipedia.org/wiki/R%C3%B6ssler_attractor) but the most famous is probably the one associated with the Lorenz system and called **Lorenz attractor**. It has a distinct butterfly-like shape and is characterized by its three-dimensional trajectory in phase space.

### Analysis of the equations
Let's consider only positive values for $$\sigma $$, $$ \rho $$ and $$\beta$$.

For $$ \rho  < 1$$ all orbits converge to the origin that is a global *attractor*.

For $$ \rho  > 1$$ there are three critical points that are the origin $$ (0,0,0) $$ and the symmetric pair

$$
\begin{pmatrix}
\pm \sqrt{\beta (\rho-1)}
\\ 
\pm \sqrt{\beta(\rho-1)}
\\ 
\rho-1 
\end{pmatrix}
$$

They represent stable equilibria, where trajectories in the Lorenz system converge towards these points. The stability of these critical points depends on the values of the system parameters σ, ρ, and β. For certain combinations of parameters, the system may show periodic orbits or settle into one of the stable equilibria.

For $$\sigma = 10$$, $$\beta = 8/3$$ and $$\rho = 28$$ the system has chaotic solutions and evolves around two attractors points showing the iconic butterfly shapes.

![Lorenz attractor](/assets/img/lorenz/yz_path.svg)
*- Lorenz attractor with parameters $$\sigma = 10$$, $$\beta = 8/3$$ and $$\rho = 28$$ viewed from the Y-Z plane -*
{: .img_xl}



## The code
The solution of the Lorenz differential equations is approximated using a fourth-order Runge-Kutta algorithm. 
The code for the simulation (JavaScript in this case) mainly uses three functions encapsulated in a class that maintains the latest status of the simulation and the equations parameters. We first define two-dimensional and three-dimensional point classes as a utility:

``` JavaScript
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
```
The first important method defines the system of differential equations; it takes a `Point3D` as an input and returns another three-dimensional point as output representing the Lorenz ODEs value for a point $$p$$:
```
Lorenz_equations(p) {
    let dx = this.param.sigma * (p.y - p.x);
    let dy = p.x * (this.param.rho - p.z) - p.y;
    let dz = p.x * p.y - this.param.beta * p.z;

    return new Point3D(dx, dy, dz);
}
```
The following function then approximates the equations at time $$t+h$$ using the Runge–Kutta method.
```
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
```

This function returns the next point in the trajectory.

Given that the solutions of the ordinary differential equation (ODE) system exist in a three-dimensional space, to visualize them on a screen, we only need to consider their projection onto a plane. Hence, the following JavaScript function calculates the trajectory for a specified number of steps and returns the corresponding projections of those steps onto the X-Z plane.

``` JavaScript
getXZ_trajectory(n_steps = 1)
{
    let point_list = [];

    for (let i = 0; i < n_steps; i++) {
        this.last_path_point = this.RungeKutta_step(this.last_path_point);

        let new_point = new Point(this.last_path_point.y, this.last_path_point.z);

        point_list.push(new_point);
    }
    
    return point_list;
}
```
This function iterates through the specified number of steps, calculating each step of the trajectory using the Runge-Kutta method (`this.RungeKutta_step`). The resulting coordinates are then used to create new points representing the projections onto the X-Z plane. These points are collected into an array and returned at the end of the function.
With the last three functions we can approximate the solution of a Lorenz system. Finally, the `update` function is responsible for updating and animating the trajectory.
The function first call the method `getXZ_trajectory()` of a previously created object for computing the next *n* steps of the trajectory. The computed `trajectory_points` are then passed as an argument to the `append_path` function of an object (`gr`) which takes care of the graphics and appends the trajectory points to the existing path. After appending the trajectory points, the `setTimeout` function is called to schedule the next frame. The `update` function will be executed again after a specified `frameInterval` of time only if the `stop` variable has not been set to `true` using the UI input button.

``` JavaScript
function update() {
   let trajectory_points = lorenz_solver.getXZ_trajectory(10);
   gr.append_path(trajectory_points);
   // Schedule the next frame
   if (!stop) setTimeout(update, frameInterval);
}  
```

![Lorenz attractor](/assets/img/lorenz/Lorenz-diff.svg)
*- The system's chaotic nature shown by distinct trajectories resulting from closely varying initial conditions, highlighting the sensitivity to small differences for specific parameter values. -*
{: .img_xl}

![Lorenz attractor](/assets/img/lorenz/lorenz-r21s13b8d3.svg)
*- Lorenz attractor with parameters $$\sigma = 13$$, $$\beta = 8/3$$ and $$\rho = 21$$. For values of ρ, smaller than 24 the system is stable and converges to one of two fixed point attractors. -*
{: .img_xl}

![Lorenz attractor](/assets/img/lorenz/Lorenz-r35s15b8d3.svg)
*- Lorenz attractor with parameters $$\sigma = 15$$, $$\beta = 8/3$$ and $$\rho = 35$$ -*
{: .img_xl}

![Lorenz attractor](/assets/img/lorenz/Lorenz-r25s4b3.svg)
*- Lorenz attractor with parameters $$\sigma = 4$$, $$\beta = 3$$ and $$\rho = 25$$. -*
{: .img_xl}


## Other posts you may be interested in
- [Implementation of Lloyd's Algorithm in JavaScript. Also referred to as Voronoi relaxation]({%post_url 2021-03-18-lloyds-algorithm%})
- [Creating voronoi diagrams with Fortune's algorithm]({%post_url 2020-11-19-voronoi-diagram-with-fortunes-algorithm%})

## References
[^1]: Wikipedia [page](https://en.wikipedia.org/wiki/Lorenz_system) on Lorenz systems.
[^2]: Strange attractors on Wikipedia [page](https://en.wikipedia.org/wiki/Attractor#Strange_attractor).