---
layout: post
title: "Computing the convex hull of a set of points"
description: "Algorithms for computing the convex hull of a random set of points. Implementation of Gift wrapping and Graham scan algorithms in JavaScript. Algorithms performance comparison."
date: 2020-11-25 12:00:00 +0000
tags: algorithms graphics
#slug: "--"
usemathjax: true
featured_img: "/assets/img/convex-hull/convex-hull-algorithm.png"
---

Implementation of Gift wrapping and Graham scan algorithms in JavaScript for constructing the convex hull of a set of points.
<!-- excer -->
{: .abstr}


<div style="margin: 50px auto;">
    <svg style="min-width: 100%;height: 300px;border: 1px solid #dcdcdc;" xmlns="http://www.w3.org/2000/svg" id="svg_hull"></svg>
    <div class="row" style="font-size: 1.2rem;">
        <div class="four columns" >
        <p>Click on the canvas to add a point</p>
        </div>
        <div class="four columns"  style="text-align:center">  
            <p>Execution time:  <em id="timer"></em></p>
        </div> 
        <div class="four columns">
            <input type="button" class="btn-control u-pull-right" id="clear" value="Clear">
        </div>
    </div>


</div>



## The problem
I recently faced the problem of building a polygon from a set of unordered points. Although this is not a hard problem to solve, when I did some research, I discovered this is part of a widely researched topic in computational geometry with some interesting algorithms proposed.

In geometry, the solution to this problem is called *convex hull*[^1].
Simplistically, the convex hull of a finite set of points is the smallest convex polygon that contains all the points. 

For a human, surrounding a bunch of points with connected lines is a simple task but, in computational geometry, there is a whole set of algorithms to solve this.

I looked at two simple ones named Gift wrapping and Graham Scan and compared their performances.


## Gift Wrapping algorithm
The Gift Wrapping[^2] algorithm is possibly the simplest of algorithms to build a convex hull. 

This starts from the leftmost point and searches for the next point on the hull comparing the angle formed by the last segment of the hull and each other point of the set. The one that identifies the smallest angle must belong to the hull. 
The algorithm terminates when the hull is connected back to the starting point forming a closed curve.

The complexity of this algorithm is $$O(nh)$$ where $$n$$ is the number of the points in the set and $$h$$ is the number of points on the convex hull. The worst-case complexity is $$O(n^2)$$.

In pseudocode:
```
S = set of points
H = points of the convex hull
p0 = leftmost point
H[0] = p0
do{
	for(p in S){
		calculate angle between p and last segment in the hull
	}
	add to H the point with the minimum angle
}while endpoint != H[0]
```

In Javascript this translates to the following code:
```
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
```

The function `polarAngle` computes the angle formed by three points. More detail in the appendix below.

## Graham Scan algorithm
The second algorithm I explored is called Graham scan[^3]. 
It starts identifying the lowest point and then sorts all others by the polar angle respect to the lowest one. Then uses a stack to detect and remove concavities from the hull.

The pseudocode is the following:
```
S = set of points
H = stack

p0 = lowest point (leftmost if there are two or more)
sort S by polar angle with P0

for(p  in S){
	while(H.length >1 && ccw(H.secondlast, H.last, p)){
		H.pop()
	}
	H.push(p)
}

```
Again, the polar angle can be calculated with the formulas described below. 

`H.secondlast` refers to the point in the stack before the last point (clearly).

`ccw` is a function that returns the sign of the angle formed by the last segment in the hull (represented by the stack) and the new point `p`:
```
function ccw(a, b, c) {
    return (a.x - b.x) * (c.y - b.y) - (c.x - b.x) * (a.y - b.y);
}
```

### Optimizations
The first version of this algorithm used the standard sorting function of the JavaScript Array class and the compare function used by the sorting routine calculated the angle twice. In a second version, I replaced the sorting function with a more performing one and precalculated the angles for each point vs `p0` mapping the array elements into a structure that contained both the points and the angles. This reduced the computation times by 50%.



## Algorithms comparison
The chart below shows the execution times for the two algorithms on a log-log plot for a number of points up to ca. $$10^6$$:

<div style="display: block; margin-bottom: 3em; max-width: 700px;"><canvas id="compchart"></canvas></div>


Given the linearity of the data, it's clear that the execution time of the algorithm is of the form $$c x^k$$.  
More precisely, fitting the Gift wrapping data I get this function[^4]:

$$
y = 0.0003x^{1.1}
$$

The execution time for the Graham scan it's slightly higher and this is line with the expectations. In fact, it exists a region of space where $$x\log{x} > x^{1.1}$$.

## Conclusions
This was an easy exercise but the results were not to be taken from granted given the output-sensitivity of the Gift wrapping algorithm. 

I will be using this code to generate convex hull of sets of point with size between 4 and 10 and it's good to know that the Gift wrapping outperforms more complex algorithms in these circumstances.




## appendix: Polar angle of three points
Both algorithms proposed above use the calculation of the angle between two segments identified by three points.
This is given by the **arctangent** function[^5]:

$$
\theta = \arctan(y,x) 
$$

where

$$
x = \left |\vec{u} \cdot \vec{v}\right |= \left | \vec{u} \right |\left | \vec{v} \right |\cos\theta
$$

$$
y = \left |\vec{u} \times \vec{v}\right |= \left | \vec{u} \right |\left | \vec{v} \right|\sin\theta
$$

can be found using the dot and cross product between the two vectors $$u$$ and $$v$$ identified by the two segments (after a translation of the origin on the point between the two segments)

In JavaScript given by this code:
```
function polarAngle(a, b, c) {
    let x = (a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y);
    let y = (a.x - b.x) * (c.y - b.y) - (c.x - b.x) * (a.y - b.y);
    return Math.atan2(y, x);
}
```
where `b` is the point in common for the two segments  






<script src="/assets/scripts/convex_hull/Chart.bundle.min.js"></script>
<script src="/assets/scripts/convex_hull/script.js"></script>










## Other posts you may be interested in
- [Creating voronoi diagrams with Fortune's algorithm]({%post_url 2020-11-19-voronoi-diagram-with-fortunes-algorithm%})
- [Lloyd's Algorithm: Voronoi diagrams relaxation]({%post_url 2021-03-18-lloyds-algorithm%})

## Notes
[^1]: More details about the [convex hull](https://en.wikipedia.org/wiki/Convex_hull) and [algorithms](https://en.wikipedia.org/wiki/Convex_hull_algorithms) for its construction
[^2]: Gift wrapping [algorithm](https://en.wikipedia.org/wiki/Gift_wrapping_algorithm)
[^3]: Graham scan [algorithm](https://en.wikipedia.org/wiki/Graham_scan)
[^4]: The coefficient may be strongly related for the system I used to run the tests.
[^5]: The [Atan2](https://en.wikipedia.org/wiki/Atan2)


