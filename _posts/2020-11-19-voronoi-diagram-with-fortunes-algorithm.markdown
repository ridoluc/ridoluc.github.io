---
layout: post
title: "Voronoi diagrams with Fortune's algorithm"
description: "Voronoi diagrams generation with Fortune's algorithm. Explanation of how the Fortune's algorithm works. JavaScript code to create Voronoi diagrams."
date: 2020-11-19 12:00:00 +0000
tags: algorithms graphics
#slug: "--"
usemathjax: true
# featured_img: "/assets/img/RunTiny/RunTiny_game_copy.jpg"
---

Voronoi diagrams are fascinating geometric object with numerous applications. However, the process for their generation may be slow and complex. Fortunately, there are elegant solutions to efficiently construct these diagrams. Here is my JavaScript implementation of the Fortune's Algorithm.
<!-- excer -->
{: .abstr}

<div style="margin: 50px auto;">
    <svg style="min-width: 100%;height: 500px;border: 1px solid #dcdcdc;" xmlns="http://www.w3.org/2000/svg" id="voronoi"></svg>
    <div class="row" style="
            font-size: 1.2rem;">
        <div class="four columns" >
        <p>Click on the canvas to add a site</p>
        </div>
        <div class="four columns"  style="text-align:center">  
            <p>Execution time:  <em id="timer"></em></p>
        </div> 
        <div class="four columns">
            <input type="button" class="btn-control u-pull-right" id="clear" value="Clear">
        </div>
    </div>
    <script src="/assets/scripts/voronoi/Voronoi.js"></script>
    <script src="/assets/scripts/voronoi/graphics.js"></script>
</div>

## Intro

The Voronoi diagram[^1] is an important geometric object that finds applications in nearest neighbour queries, mesh generation, travelling salesman problems and many more.

Given a set of sites (points) on a plane, a Voronoi diagram is a geometric object that partitions the plane into regions around each site. Each region contains the points closer to that site than to any other. The _Voronoi Edges_ represent the segments that are equidistant to two sites. These edges intersect at points called _Voronoi vertices_ that are equidistant to three or more sites.

The generation of a Voronoi diagram is a nearly impossible task when using a brute-force approach but can be efficiently solved thanks to elegant algorithms.

A brilliant approach to this problem came from Steven Fortune. The so-called Fortune's Algorithm[^2] uses a sweepline that moves across the plane updating the geometry only at certain specific points generating the diagram with a complexity $$O(n \log(n))$$.

It's an elegant solution to a complex problem and I will try to illustrate the main aspects below.

## The algorithm

The algorithm key concept is built around the definition of parabola. Given a line named _directrix_ and a point called _focus_, a parabola is the **locus of points in a plane that are equidistant from both the directrix and the focus**.

<div style="margin: 50px auto; max-width:500px">
<svg
    style="
        min-width: 100%;
        height: 300px;
        border: 1px solid #dcdcdc;
    "
    xmlns="http://www.w3.org/2000/svg">
    <line
        y1="206.125"
        y2="206.125"
        x1="0"
        x2="500"
        stroke="#ccc"
        stroke-width="0.5"
        fill="transparent"
        id="directrix">
    </line>
    <circle
        r="2"
        cx="250"
        cy="100"
        class="point_svg"
        style="fill: red"
    ></circle>
    <path
        d="M 69.7570649789568 0 Q 250 306.125 430.2429350210432 0"
        class="parabola_svg"
        style="stroke: black; stroke-width: 0.5; fill: transparent"
    ></path>
</svg>
<p style="
    font-size: 1rem;
    color: rgb(157, 157, 157);
    text-align: center;"
>This chart shows a parabola and its focus in red. The horizontal line below is the directrix</p>
</div>


From the definition follows that if two parabolas have the same directrix their intersection point is equidistant to the two focuses.

As the directrix moves across the plane the intersection points divide the plane into two regions that respectively contains all the points closer to the region's focus.

Given two parabolas $$A$$ and $$B$$, defined by the focii $$f_A$$ and $$f_B$$ and a common directrix $$d$$, the $$x$$ coordinates of their intersections are given by:

$$
\frac{x_{f_B}(y_{f_A}-d)-x_{f_A}(y_{f_B}-d)\pm \sqrt{(y_{f_A}-d)(y_{f_B}-d)[(x_{f_A}-x_{f_B})^2+(y_{f_A}-y_{f_B})^2]}}{y_{f_A}-y_{f_B}}
$$

<div style="margin: 50px auto; max-width:500px">
    <svg style="min-width: 100%;height: 300px;border: 1px solid #dcdcdc;" xmlns="http://www.w3.org/2000/svg" id="chart1"></svg>
    <div class="row">
        <div class="eight columns">
        <p style="
    font-size: 1rem;
    color: rgb(157, 157, 157);">This chart illustrate how two intersecting parabola sharing the same directrix define a Voronoi edge. You can click on the chart to insert a new site and see how the algorithm work. <strong>Note</strong>: the new points must have decreasing y-coordinate. To reset the points press the clear button.</p>
        </div>
        <div class="four columns">
            <input type="button" class="btn-control u-pull-right" id="reset-btn" value="Clear">
        </div>
    </div>
    <div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <script src="/assets/scripts/voronoi/debug/Parabola.js"></script>
    <script src="/assets/scripts/voronoi/debug/BinomialThree.js"></script>
    <script src="/assets/scripts/voronoi/debug/Point.js"></script>
    <script src="/assets/scripts/voronoi/debug/Segment.js"></script>
    <script src="/assets/scripts/voronoi/debug/Circle.js"></script>
    <script src="/assets/scripts/voronoi/debug/VoronoiEvent.js"></script>
    <script src="/assets/scripts/voronoi/debug/Voronoi.js"></script>
    <script src="/assets/scripts/voronoi/main.js"></script>

</div>


The Fortune's algorithm uses a sweepline representing a directrix that moves across the plane and a complex curve called _beachline_ composed by consecutive parabolic arcs.

The beachline evolves while the sweepline moves: when crosses a new site a new arc is added to the beachline.
When an arc is squeezed between two others, it disappears and is removed from the beachline. At this point two Voronoi edges intersect in a point called Voronoi vertex.

While moving the sweepline across the plane, the algorithm only update the geometry at certain points called _events_.
There are two types of events:
- **Point Event**: represented by the focuses, is when a new parabola is added in the beachline
- **Vertex Event**: the point where two edges intersect and an arc is deleted.

I will assume the sweepline moves vertically across the plane.

The events are kept in a queue and sorted by their $$y$$ coordinate. At each step, the first event in the queue is extracted and executed.

The algorithm starts with an empty beach line and the list of sites
The main logic is quite simple:

```
event _queue = list of sites sorted by y coordinate
while(event_queue is not empty)
	e <- extract smaller event from the queue
	if (e == point event) execute point event
	else execute vertex event
```

To understand it better is necessary to look in more detail a few elements:
The beach line data structure
Handling of a point event
Handling of a vertex event

## the BeachLine

The beachline is the structure that contains the parabolic arcs. It needs to support the operations of search, addition and deletion.  
I structured it as a linked list. Each node of the list is an arc and is simply identified by the parabola focus. Each node also has a pointer to the right and left neighbour arcs and left and right edges.

### Searching

The search operation is aimed at finding which arc projection on the x-axis contains a certain $$x$$ coordinate.
To navigate the list just start from the root that will be the leftmost arc and move right until you find the desired arc:

```
let p = new site
let n = beachline root;
while (n.right != null && find_parabola_intersection(n, n.right) < p.x )
{
	n = n.right;
}
```

The search will stop when the intersection point between the parabola $$n$$ and $$n+1$$ (on the right side of $$n$$) is greater than the $$x$$ coordinate.

### Adding an arc

Unless the beachline is empty, in which case the root is assigned, the arc $$p$$ to be inserted must fall on another arc $$q$$.
In the insertion process, $$q$$ will be split into two arcs with the same focus: $$q_l$$ on the left of $$p$$ and $$q_r$$ on the right. It is important to carefully update the relevant left and right neighbours as well as their edges.

### Deleting an arc

To delete an arc just update its left and right neighbour's links accordingly.

## Point event

A point event is handled when the sweep line reaches a new site. Here, a new parabola is inserted into the beach line.
These are the steps execute on a point event:

1. Create a new arc $$p$$ with the new site as a focus;
2. Find where this arc should be located in the beach line. This is given by the $$x$$ coordinate of the site identifying an arc $$q$$ as described above;
1. Add $$p$$ to the beach line as described above splitting the parabola $$q$$ in $$q_l$$ and $$q_r$$;
1. Delete any vertex event related to the arc $$q$$;
1. Add vertex events for $$q_l$$ and $$q_r$$ (described later);
1. Create a new Voronoi edge.


## Vertex Event

A vertex event take place when an arc is squeezed between two other arcs. Here, two edges intersect on a Voronoi vertex. This is sometimes called a circle event as the Voronoi vertex is the centre of a circle that passes through the focus of the shrinking arc and its left and right neighbours.

<div style="margin: 50px auto; max-width:500px">
<svg style="
min-width: 100%;
height: 300px;
border: 1px solid #dcdcdc;
" xmlns="http://www.w3.org/2000/svg" id="chart1"><line y1="236.125" y2="236.125" x1="0" x2="500" stroke="#ccc" stroke-width="0.5" fill="transparent" id="directrix"></line><circle r="2" cx="141" cy="86.125" class="point_svg" style="fill:red"></circle><path d="M 0 94.855 Q 116.96022219891957 204.79760886698438 233.92044439783913 132.34430337636027" class="parabola_svg" style="  stroke: black;stroke-width: 0.5;fill: transparent;"></path><circle r="2" cx="337" cy="120.125" class="point_svg" style="fill:red"></circle><line x1="337" y1="-461.81617647058823" x2="233.93541666666667" y2="132.32083333333333" class="segment_svg" style="stroke: rgb(205, 207, 239);stroke-width: 0.4;fill: transparent;"></line><circle r="2" cx="315" cy="197.125" class="point_svg" style="fill:red"></circle><path d="M 373.80931310545594 172.284803744416 Q 436.90465655272794 152.2632843267702 500 63.60344827586207" class="parabola_svg" style="  stroke: black;stroke-width: 0.5;fill: transparent;"></path><line x1="315" y1="155.48214285714286" x2="233.93541666666667" y2="132.32083333333333" class="segment_svg" style="stroke: rgb(205, 207, 239);stroke-width: 0.4;fill: transparent;"></line><line x1="315" y1="155.48214285714286" x2="373.80931310545594" y2="172.284803744416" class="segment_svg" style="stroke: rgb(205, 207, 239);stroke-width: 0.4;fill: transparent;"></line><path d="M 233.92044439783913 132.34430337636033 Q 303.86487875164755 277.7561919469065 373.80931310545594 172.284803744416" class="parabola_svg" style="  stroke: black;stroke-width: 0.5;fill: transparent;"></path><line x1="233.93541666666667" y1="132.32083333333333" x2="233.92044439783913" y2="132.34430337636033" class="segment_svg" style="stroke: rgb(205, 207, 239);stroke-width: 0.4;fill: transparent;"></line>
<circle cx="233.93" cy="132.32" r="103.82" style="fill: none;stroke: darkgrey;stroke-dasharray: 3;"></circle>
</svg>
<p style="
    font-size: 1rem;
    color: rgb(157, 157, 157);
    text-align: center;"
>This chart illustrates the concept of "Vertex or Circle event". Note the bottom of the circle is tangent to the sweepline. This position of the sweepline is the position of the event.</p>
</div>

The operations to handle a circle event are the following:

1. Delete the shrinking arc p from the beachline
2. Create a new Voronoi vertex where the two edges intersect
3. Add a new Voronoi edge starting from vertex just added
4. Add vertex events for the arc p.left 
5. Add vertex events for the arc p.right


## Adding a vertex event

As mentioned above, a vertex event takes place where two edges intersect and an arc disappears. This point is equidistant to the three focuses of the arcs involved. From the parabola definition, this is also equal to the distance between the Voronoi vertex and the directrix (or sweepline).

If we assume the Voronoi vertex to be the centre of a circle the bottommost point of the circle is tangent to the sweepline.

These considerations suggest that the position of a Vertex event can be found adding the circle radius to the $$y$$ coordinate of the intersection of the edges.

However, not every triplet of arcs generates a Vertex event. To insert a new Vertex event in the queue the event must be below the current sweepline position and the angle identified by the three focuses must be less than 180 degrees (otherwise the edges are not converging)

## Other considerations

### Completing the edges

Once the last event has been executed, the product of the algorithm is a collection of edges and vertices. However, some edges may not be complete. The ones still attached to the beachline will not have an endpoint but just a starting point. Other edges will have a starting point outside the drawing canvas and some other will be completely outside.

To complete the Voronoi diagram some cleanup is needed. This process depends on the structure of data used and the information produced during the execution. Based on my experience this is the trickiest part of the whole algorithm as you need to identify and manage several cases in distinct ways.

### Graphics

Drawing the diagram depends on the platform and language used. I wrote the program in JavaScript and built the graphics elements in SVG. The basic SVG tags (line, circle and path) are very convenient for rendering geometric objects.

## Full code

The full JavaScript code and details about the usage can be found on the [github](https://github.com/ridoluc/Voronoi-Diagram) page.

## Other posts you may be interested in
- [Computing the convex hull of a set of points]({%post_url 2020-11-25-convex-hull-algorithms-for-a-set-of-points%})
- [Lloyd's Algorithm: Voronoi diagrams relaxation]({%post_url 2021-03-18-lloyds-algorithm%})


## Notes

[^1]: The Wikipedia pages about [Voronoi diagram](https://en.wikipedia.org/wiki/Voronoi_diagram) and [Fortune's Algorithm](https://en.wikipedia.org/wiki/Fortune%27s_algorithm)
[^2]: Steven Fortunes [paper](http://www.wias-berlin.de/people/si/course/files/Fortune87-SweepLine-Voronoi.pdf)
