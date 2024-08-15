---
layout: post
title: "Lloyd's Algorithm: Voronoi diagrams relaxation"
description: "Implementation of Lloyd's algorithm in JavaScript"
date: 2021-03-18 12:00:00 +0000
tags: algorithms graphics
#slug: "--"
usemathjax: true
featured_img: "/assets/img/Lloyds/lloyd_img.png"
---

Implementation of Lloyd's Algorithm in JavaScript. Also referred to as Voronoi relaxation, it is often used to evenly distribute partitions of space. It also offers nice graphical effects
<!-- excer -->
{: .abstr}

<div style="margin: 50px auto;">
    <svg style="min-width: 100%;height: 300px;border: 1px solid #dcdcdc;" xmlns="http://www.w3.org/2000/svg" id="svg_lloyd"></svg>
    <div class="row" style="font-size: 1.2rem;">
        <div class="four columns" >
        <p style="margin-bottom: 3px">Click to add a point</p>
        <p>Frame time:  <em id="timer"></em></p>
        </div>
        <!-- <div class="four columns"  style="text-align:center">  
        </div>  -->
        <!-- <div class="four columns">
            <input type="button" class="btn-control u-pull-right" id="clear" value="Clear">
        </div> -->
        <div class="four columns">
            <input type="button" class="btn-control u-pull-right" id="generate-btn" value="Generate">
        </div>
        <div class="four columns">
            <input type="text" class="u-pull-right" style="max-width: 80px;" id="generate-text" value="200">
        </div>
    </div>
    <script src="/assets/scripts/lloyds/Voronoi.js"></script>
    <script src="/assets/scripts/lloyds/graphics.js"></script>
    <script src="/assets/scripts/lloyds/main.js"></script>
</div>

## Intro
The Lloyd's Algorithm[^1], often referred to as Voronoi relaxation, is a computational geometry algorithm used for distributing a set of point in the space evenly. The algorithm also partitions the space in uniformly shaped convex cells.  
This finds applications in several problems that range from smoothing geometry meshes used in finite element methods to artistic patterns like stippling.
I'm usually fascinated by geometric algorithms and even more when these have beautiful graphical translations.   
Since I already wrote a JavaScript implementation of [Steven Fortune's Algorithm]({%post_url 2020-11-19-voronoi-diagram-with-fortunes-algorithm%}) for computing Voronoi diagrams, building a Lloyd's Algorithm was an easy task.  
I wrote below a few details about this.

## The Algorithm
The algorithm is based on iteratively computing the Voronoi diagram of a set of points equal to the centroid of the Voronoi cells of the earlier iteration.

```
Do while the set S has not converged:
1. Generate the Voronoi tesselation for a set of points S
2. Compute the centroid of each Voronoi cell
3. Update S using the centroids
```

### Generation of Voronoi diagram
The generation of the Voronoi diagram is the most complex step. I wrote more about it in [this post]({%post_url 2020-11-19-voronoi-diagram-with-fortunes-algorithm%}). My JavaScript code is on [GitHub](https://github.com/ridoluc/Voronoi-Diagram).
The code is simple and takes as input a set of points and outputs a list of polygons identified by their vertices.

### Computations of centroids
Generically, the centroid of a region characterized by a density function $$\rho$$ is defined as:

$$
C = \frac{\int_{A}\mathbf{x}\rho(\mathbf{x}) dA}{\int_{A}\rho(\mathbf{x}) dA}
$$ 

where $$A$$ is the region of interest.
Assuming that the regions are convex polygons with constant density, the  centroid coordinates[^2] can be found with:

$$
C_{\mathrm x} = \frac{1}{6A}\sum_{i=0}^{n-1}(x_i+x_{i+1})(x_i\ y_{i+1} - x_{i+1}\ y_i)
$$

and

$$
C_{\mathrm y} = \frac{1}{6A}\sum_{i=0}^{n-1}(y_i+y_{i+1})(x_i\ y_{i+1} - x_{i+1}\ y_i)
$$

where the polygon area $$A$$ is:

$$
A = \frac{1}{2}\sum_{i=0}^{n-1} (x_i\ y_{i+1} - x_{i+1}\ y_i)
$$

Here the vertices index is ordered along the path.
Since the Voronoi algorithm returns a list of unordered vertices for each site, I first need to compute the convex hull of the cell.
I discuss two methods in [this post]({%post_url 2020-11-25-convex-hull-algorithms-for-a-set-of-points%}).

### Convergence
The process can be simply stopped once the cumulative distance between the points of two subsequent iterations is below a certain threshold. 


## Other posts you may be interested in
- [Computing the convex hull of a set of points]({%post_url 2020-11-25-convex-hull-algorithms-for-a-set-of-points%})
- [Creating voronoi diagrams with Fortune's algorithm]({%post_url 2020-11-19-voronoi-diagram-with-fortunes-algorithm%})

## References
[^1]: Wikipedia [page](https://en.wikipedia.org/wiki/Lloyd%27s_algorithm)
[^2]: [Centroid](https://en.wikipedia.org/wiki/Centroid#Of_a_polygon) of a polygon.
