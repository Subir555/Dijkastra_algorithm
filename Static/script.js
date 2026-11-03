let maxVertices = 0;
let vertices = [];
let edges = [];
let visitedVertices = [];
let lastSampleIndex = -1;

const vertex_input = document.getElementById("vertexcount");
const from_input = document.getElementById("fromvertex");
const to_input = document.getElementById("tovertex");
const weight_input = document.getElementById("weight");
const add_edge_btn = document.getElementById("addedge");
const clear_Graph_Btn = document.getElementById("cleargraph");
const graph_canvas = document.getElementById("graphcanvas");

const runbtn = document.getElementById("runbtn");
const source_input = document.getElementById("sourcevertex");
const distance_table = document.getElementById("distancetable");
const shortest_path = document.getElementById("shortestpath");
const step_log = document.getElementById("steplog");
const sample_btn = document.getElementById("samplebtn");
const clear_logbtn = document.getElementById("clearlogbtn");

vertex_input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();


        let count = Number(vertex_input.value);
        if (!Number.isInteger(count) || count < 1 || count > 26) {
            alert("please enter a valid number b/w 1 to 26");
            return;
        }

        if (vertices.length > 0 || edges.length > 0) {
            let cl = confirm("Do you want to clear this graph?");

            if (!cl) {
                return;
            }
        }

        fetch("/api/vertices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                count: count
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error)
                }

                maxVertices = count;
                vertices = data.vertices;
                edges = data.edges;
                directedEdges = [];
                visitedVertices = [];
                source_input.value = "";
                distance_table.innerHTML = "";
                shortest_path.innerHTML = "";
                step_log.innerHTML = "";
                directed_checkbox.checked = false;

                drawGraph();

                alert(data.message);

            })
            .catch(error => {
                alert(error.message);
            });

    }
});

source_input.addEventListener("input", function () {
    source_input.value = source_input.value.toUpperCase();
});


add_edge_btn.addEventListener("click", function () {
    let from = from_input.value.trim().toUpperCase();
    let to = to_input.value.trim().toUpperCase();
    let weight = Number(weight_input.value);

    if (maxVertices === 0) {
        alert("enter the number of vertices");
        return;
    }

    if (!from || !to || weight_input.value.trim() === "") {
        alert("please fill all field");
        return;
    }

    if (!/^[A-Z]$/.test(from) || !/^[A-Z]$/.test(to)) {
        alert("capital alphabet from A-Z are allowed");
        return;
    }

    if (weight < 0) {
        alert("please enter a valid non-negative weight");
        return;
    }

    if (from === to) {
        alert("A vertex cannot connect itself");
        return;
    }


    let newvertices = [];

    if (!vertices.includes(from)) {
        newvertices.push(from);
    }

    if (!vertices.includes(to) && to !== from) {
        newvertices.push(to);
    }

    if (vertices.length + newvertices.length > maxVertices) {
        alert(
            `${maxVertices} vertices are allowed`
        );

        return;
    }

    fetch("/api/edge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            source: from,
            destination: to,
            weight: weight,
            directed: directed_checkbox.checked

        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error)
            }
            else {
                edges = data.edges;

                if (!vertices.includes(from)) {
                    vertices.push(from);
                }

                if (!vertices.includes(to)) {
                    vertices.push(to);
                }

                lockDirectionbox();

                if (directed_checkbox.checked) {
                    directedEdges = directedEdges.filter(e => !(e.from === from && e.to === to));
                    directedEdges.push({ from: from, to: to });
                } else {
                    directedEdges = directedEdges.filter(e => !((e.from === from && e.to === to) || (e.from === to && e.to === from))
                    );

                }

                visitedVertices = [];
                distance_table.innerHTML = "";
                shortest_path.innerHTML = "";
                step_log.innerHTML = "";

                drawGraph();

                from_input.value = "";
                to_input.value = "";
                weight_input.value = "";

                //alert(data.message);
            }
        })
        .catch(error => {
            alert(error.message);
        })
});


function drawGraph() {
    graph_canvas.innerHTML = "";

    const svgns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgns, "svg");
    svg.setAttribute("viewBox", "0 0 700 480");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");

    let pos = {};
    const centerX = 350;
    const centerY = 240;
    const radiusX = 260;
    const radiusY = 170;

    vertices.forEach((vertex, index) => {
        let angle = (2 * Math.PI * index / vertices.length) - Math.PI / 2;
        pos[vertex] = {
            x: centerX + radiusX * Math.cos(angle),
            y: centerY + radiusY * Math.sin(angle)
        };
    });

    let latestDirectedMap = new Map();
    directedEdges.forEach(d => {
        let pairKey = [d.from, d.to].sort().join("-");
        latestDirectedMap.set(pairKey, d);
    });

    edges.forEach(edge => {
        let p1 = pos[edge.from];
        let p2 = pos[edge.to];
        if (!p1 || !p2) return;

        let line = document.createElementNS(svgns, "line");
        line.setAttribute("x1", p1.x);
        line.setAttribute("y1", p1.y);
        line.setAttribute("x2", p2.x);
        line.setAttribute("y2", p2.y);
        line.setAttribute("stroke", "#405473");
        line.setAttribute("stroke-width", "2.5");
        svg.appendChild(line);

        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return;

        let ux = dx / len;
        let uy = dy / len;

        let px = -uy;
        let py = ux;
        if (py > 0 || (py === 0 && px < 0)) {
            px = -px;
            py = -py;
        }

        let directedMatch = null;
        for (let [key, d] of latestDirectedMap.entries()) {
            if ((d.from === edge.from && d.to === edge.to) || (d.from === edge.to && d.to === edge.from)) {
                directedMatch = d;
                break;
            }
        }

        if (directedMatch) {
            let dp1 = pos[directedMatch.from];
            let dp2 = pos[directedMatch.to];
            if (dp1 && dp2) {
                let ddx = dp2.x - dp1.x;
                let ddy = dp2.y - dp1.y;
                let dlen = Math.sqrt(ddx * ddx + ddy * ddy);
                if (dlen > 0) {
                    let dux = ddx / dlen;
                    let duy = ddy / dlen;

                    let stringKey = [directedMatch.from, directedMatch.to].sort().join("-");
                    let hash = 0;
                    for (let i = 0; i < stringKey.length; i++) {
                        hash = stringKey.charCodeAt(i) + ((hash << 5) - hash);
                    }
                    let normalizedHash = Math.abs(hash) % 100 / 100;
                    let arrowOffsetFactor = 0.35 + normalizedHash * 0.4;
                    let arrowOffsetDistance = dlen * arrowOffsetFactor;
                    let arrowCenterX = dp1.x + dux * arrowOffsetDistance;
                    let arrowCenterY = dp1.y + duy * arrowOffsetDistance;

                    let arrowLength = 14;
                    let arrowWidth = 7;
                    let tipX = arrowCenterX + dux * (arrowLength / 2);
                    let tipY = arrowCenterY + duy * (arrowLength / 2);
                    let baseX = arrowCenterX - dux * (arrowLength / 2);
                    let baseY = arrowCenterY - duy * (arrowLength / 2);

                    let arrow = document.createElementNS(svgns, "polygon");
                    arrow.setAttribute("points",
                        `${tipX},${tipY} ` +
                        `${baseX + px * arrowWidth},${baseY + py * arrowWidth} ` +
                        `${baseX - px * arrowWidth},${baseY - py * arrowWidth}`
                    );
                    arrow.setAttribute("fill", "#405473");
                    svg.appendChild(arrow);

                    let textOffset = 16;
                    let weightText = document.createElementNS(svgns, "text");
                    weightText.setAttribute("x", arrowCenterX + px * textOffset);
                    weightText.setAttribute("y", arrowCenterY + py * textOffset);
                    weightText.setAttribute("text-anchor", "middle");
                    weightText.setAttribute("dominant-baseline", "central");
                    weightText.setAttribute("fill", "#17233f");
                    weightText.setAttribute("font-size", "15");
                    weightText.setAttribute("font-weight", "600");
                    weightText.setAttribute("stroke", "#ffffff");
                    weightText.setAttribute("stroke-width", "4");
                    weightText.setAttribute("paint-order", "stroke fill");
                    weightText.textContent = edge.weight;
                    svg.appendChild(weightText);
                }
            }
        } else {
            let stringKey = [edge.from, edge.to].sort().join("-");
            let hash = 0;
            for (let i = 0; i < stringKey.length; i++) {
                hash = stringKey.charCodeAt(i) + ((hash << 5) - hash);
            }
            let normalizedHash = Math.abs(hash) % 100 / 100;
            let offsetFactor = 0.35 + normalizedHash * 0.3;
            let centerDist = len * offsetFactor;
            let weightCenterX = p1.x + ux * centerDist;
            let weightCenterY = p1.y + uy * centerDist;
            let textOffset = 15;
            let weightText = document.createElementNS(svgns, "text");
            weightText.setAttribute("x", weightCenterX + px * textOffset);
            weightText.setAttribute("y", weightCenterY + py * textOffset);
            weightText.setAttribute("text-anchor", "middle");
            weightText.setAttribute("dominant-baseline", "central");
            weightText.setAttribute("fill", "#17233f");
            weightText.setAttribute("font-size", "15");
            weightText.setAttribute("font-weight", "600");
            weightText.setAttribute("stroke", "#ffffff");
            weightText.setAttribute("stroke-width", "4");
            weightText.setAttribute("paint-order", "stroke fill");
            weightText.textContent = edge.weight;
            svg.appendChild(weightText);
        }
    });

    vertices.forEach(vertex => {
        let p = pos[vertex];

        let circle = document.createElementNS(svgns, "circle");
        circle.setAttribute("cx", p.x);
        circle.setAttribute("cy", p.y);
        circle.setAttribute("r", "23");

        if (visitedVertices.includes(vertex)) {
            circle.setAttribute("fill", "#16a34a");
        } else {
            circle.setAttribute("fill", "#2879e9");
        }

        circle.setAttribute("stroke", "#bfdbfe");
        circle.setAttribute("stroke-width", "4");
        svg.appendChild(circle);

        let label = document.createElementNS(svgns, "text");
        label.setAttribute("x", p.x);
        label.setAttribute("y", p.y + 5);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("fill", "#ffffff");
        label.setAttribute("font-size", "17");
        label.setAttribute("font-weight", "650");
        label.textContent = vertex;
        svg.appendChild(label);
    });

    graph_canvas.appendChild(svg);
}

function drawDirectedArrows() { }

const directed_checkbox = document.getElementById("directedgraph");
let directedEdges = [];

function lockDirectionbox() {
    if (edges.length > 0) {
        directed_checkbox.disabled = true;
        directed_checkbox.title = "Clear graph to change this";
    }
    else {
        directed_checkbox.disabled = false;
        directed_checkbox.title = "";
    }
}

clear_Graph_Btn.addEventListener("click", function () {
    fetch("/api/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({

        })
    })
        .then(response => response.json())
        .then(data => {
            maxVertices = 0;
            vertices = [];
            edges = [];

            vertex_input.value = "";
            from_input.value = "";
            to_input.value = "";
            weight_input.value = "";
            source_input.value = "";

            distance_table.innerHTML = "";
            shortest_path.innerHTML = "";
            step_log.innerHTML = "";

            directed_checkbox.checked = false;
            lockDirectionbox();
            window.algorithmAlreadyRun = false;

            drawGraph();
        })
        .catch(error => {
            alert(error.message);
        });

});

clear_logbtn.addEventListener("click", function () {
    step_log.innerHTML = "";
});

runbtn.addEventListener("click", async function () {
    let source = source_input.value.trim().toUpperCase();
    //let source = source_input.value;
    if (vertices.length == 0) {
        alert("Add Vertices to the Graph!");
        return;
    }

    if (edges.length == 0) {
        alert("Add Edges to the Graph!");
        return;
    }

    if (!source) {
        alert("Enter Source Vertex");
        return;
    }

    if (!vertices.includes(source)) {
        alert("Source Vertex does not exist!");
        return;
    }
    fetch("/api/shortest-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            vertices: vertices,
            edges: edges,
            source: source
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            displayData(data);
        })

        .catch(error => {
            console.log(error);
            alert(error);
        })
});

function displayData(data) {
    distance_table.innerHTML = "";
    shortest_path.innerHTML = "";
    step_log.innerHTML = "";

    let sortedvertices = [data.source];


    vertices.forEach(vertex => {

        if (vertex != data.source) {
            sortedvertices.push(vertex);
        }
    });

    sortedvertices.forEach(vertex => {
        let row = document.createElement("tr");

        let vertex_cell = document.createElement("td");
        vertex_cell.textContent = vertex;

        let distance_cell = document.createElement("td");

        if (data.distances[vertex] == null) {
            distance_cell.textContent = "\u221E";
        }
        else {
            distance_cell.textContent = data.distances[vertex];
        }

        let status_cell = document.createElement("td");

        let visited = data.steps.some(step =>
            step.visited.includes(vertex)
        );

        if (visited) {
            status_cell.textContent = "Visited";
            status_cell.classList.add("visited");
        }
        else {
            status_cell.textContent = "Unvisited";
            status_cell.classList.add("unvisited");
        }

        row.appendChild(vertex_cell);
        row.appendChild(distance_cell);
        row.appendChild(status_cell);

        distance_table.appendChild(row);


        let path_row = document.createElement("tr");

        let path_vertexcell = document.createElement("td");
        path_vertexcell.textContent = vertex;

        let path_cell = document.createElement("td");


        if (data.paths[vertex]) {
            path_cell.textContent = data.paths[vertex].display;
        }
        else {
            path_cell.textContent = " Path not available";
        }

        path_row.appendChild(path_vertexcell);
        path_row.appendChild(path_cell);
        shortest_path.appendChild(path_row);
    });

}

function updateDistanceTable(data, step) {
    distance_table.innerHTML = "";

    let sortedvertices = [data.source];

    vertices.forEach(vertex => {
        if (vertex != data.source) {
            sortedvertices.push(vertex);
        }
    });

    sortedvertices.forEach(vertex => {
        let row = document.createElement("tr");

        let vertex_cell = document.createElement("td");
        vertex_cell.textContent = vertex;

        let distance_cell = document.createElement("td");

        if (step.distances[vertex] == null) {
            distance_cell.textContent = "\u221E";
        }
        else {
            distance_cell.textContent = step.distances[vertex];
        }

        let status_cell = document.createElement("td");

        if (step.visited.includes(vertex)) {
            status_cell.textContent = "Visited";
            status_cell.classList.add("visited");
        }
        else {
            status_cell.textContent = "Unvisited";
            status_cell.classList.add("unvisited");
        }

        row.appendChild(vertex_cell);
        row.appendChild(distance_cell);
        row.appendChild(status_cell);

        distance_table.appendChild(row);

    });
}

const sample_graphs = [
    { directed: false, count: 5, edges: [["A", "B", 4], ["A", "C", 2], ["B", "C", 1], ["B", "D", 5], ["C", "D", 8], ["C", "E", 10], ["D", "E", 2]] },
    { directed: true, count: 5, edges: [["A", "B", 10], ["A", "C", 3], ["B", "D", 2], ["C", "B", 4], ["C", "D", 8], ["C", "E", 2], ["D", "E", 7]] },
    { directed: false, count: 6, edges: [["A", "B", 7], ["A", "C", 9], ["A", "F", 14], ["B", "C", 10], ["B", "D", 15], ["C", "D", 11], ["C", "F", 2], ["D", "E", 6], ["E", "F", 9]] },
    { directed: true, count: 6, edges: [["A", "B", 7], ["A", "C", 9], ["A", "F", 14], ["B", "C", 10], ["B", "D", 15], ["C", "D", 11], ["C", "F", 2], ["F", "E", 9], ["D", "E", 6]] },
    { directed: false, count: 4, edges: [["A", "B", 3], ["B", "C", 4], ["C", "D", 5], ["D", "A", 6], ["A", "C", 10]] },
    { directed: false, count: 7, edges: [["A", "B", 2], ["A", "C", 6], ["B", "D", 5], ["C", "D", 8], ["D", "E", 10], ["D", "F", 15], ["E", "F", 6], ["E", "G", 2], ["F", "G", 6]] },
    { directed: true, count: 4, edges: [["A", "B", 5], ["B", "C", 3], ["C", "D", 1], ["A", "D", 12], ["D", "B", 2]] },
    { directed: false, count: 6, edges: [["A", "B", 1], ["A", "C", 5], ["B", "C", 2], ["B", "D", 4], ["C", "E", 3], ["D", "E", 1], ["D", "F", 6], ["E", "F", 2]] },
    { directed: true, count: 7, edges: [["A", "B", 2], ["A", "C", 4], ["B", "D", 7], ["C", "E", 3], ["D", "F", 1], ["E", "D", 2], ["E", "F", 5], ["F", "G", 3], ["G", "A", 8]] },
    { directed: true, count: 6, edges: [["A", "B", 6], ["A", "E", 2], ["D", "E", 1], ["B", "C", 5], ["E", "C", 5], ["C", "F", 3], ["E", "F", 9]] },
    { directed: false, count: 5, edges: [["A", "B", 4], ["B", "C", 3], ["C", "D", 5], ["D", "E", 2], ["E", "A", 6], ["B", "E", 7]] },
    { directed: false, count: 6, edges: [["A", "B", 2], ["B", "C", 5], ["C", "D", 3], ["D", "E", 4], ["E", "F", 1], ["F", "A", 6], ["A", "D", 8], ["C", "F", 7]] },
    { directed: false, count: 7, edges: [["A", "B", 3], ["B", "C", 2], ["C", "D", 6], ["D", "E", 4], ["E", "F", 3], ["F", "G", 5], ["G", "A", 7], ["B", "F", 9], ["C", "G", 8]] },
    { directed: false, count: 6, edges: [["A", "B", 4], ["B", "C", 3], ["A", "C", 6], ["D", "E", 2], ["E", "F", 5], ["D", "F", 7], ["A", "D", 1], ["B", "E", 8], ["C", "F", 2]] },
    { directed: false, count: 8, edges: [["A", "B", 3], ["B", "C", 4], ["C", "D", 2], ["D", "A", 5], ["E", "F", 6], ["F", "G", 1], ["G", "H", 4], ["H", "E", 3], ["A", "E", 7], ["B", "F", 2], ["C", "G", 5], ["D", "H", 6]] },
    { directed: true, count: 5, edges: [["A", "B", 4], ["B", "C", 3], ["C", "D", 2], ["D", "E", 6], ["E", "A", 5], ["A", "C", 9], ["C", "E", 8], ["D", "B", 1]] },
    { directed: true, count: 6, edges: [["A", "B", 2], ["B", "C", 4], ["C", "D", 3], ["D", "E", 5], ["E", "F", 2], ["F", "A", 7], ["B", "E", 6], ["D", "B", 1], ["F", "C", 3]] },
    { directed: true, count: 4, edges: [["A", "B", 5], ["B", "C", 2], ["C", "D", 4], ["D", "A", 3], ["A", "C", 9], ["B", "D", 8], ["C", "A", 6]] },
    { directed: true, count: 7, edges: [["A", "B", 3], ["B", "C", 2], ["C", "D", 4], ["D", "E", 3], ["E", "F", 2], ["F", "G", 5], ["G", "A", 6], ["A", "D", 9], ["C", "F", 8], ["E", "B", 1], ["G", "C", 4]] },
    { directed: false, count: 6, edges: [["A", "B", 5], ["B", "C", 2], ["C", "D", 4], ["D", "E", 3], ["E", "F", 6], ["F", "A", 2], ["B", "F", 3], ["B", "E", 7], ["C", "E", 1]] },
];

sample_btn.addEventListener("click", function () {

    if (vertices.length > 0 || edges.length > 0) {
        let clear_it = confirm("Do you want to clear this graph?\n\n");

        if (!clear_it) {
            return;
        }
    }

    let index;

    do {
        index = Math.floor(Math.random() * sample_graphs.length);
    }
    while (index == lastSampleIndex);
    lastSampleIndex = index;

    let sample = sample_graphs[index];

    sample_btn.disabled = true;

    fetch("/api/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
    })
        .then(response => response.json())
        .then(data => {
            maxVertices = 0;
            vertices = [];
            edges = [];
            directedEdges = [];

            vertex_input.value = "";
            from_input.value = "";
            to_input.value = "";
            weight_input.value = "";
            source_input.value = "";

            distance_table.innerHTML = "";
            shortest_path.innerHTML = "";
            step_log.innerHTML = "";

            drawGraph();

            return fetch("/api/vertices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    count: sample.count
                })
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                sample_btn.disabled = false;
                return;
            }
            maxVertices = sample.count;

            addSampleEdge(sample, 0);
        })
        .catch(error => {
            alert(error.message);
            sample_btn.disabled = false;
        });
});

function addSampleEdge(sample, i) {
    if (i == sample.edges.length) {
        vertices.sort();

        directedEdges = edges
            .filter(e => e.directed)
            .map(e => ({ from: e.from, to: e.to }));

        source_input.value = vertices[0];
        directed_checkbox.checked = sample.directed;
        drawGraph();

        sample_btn.disabled = false;
        return;


    }

    let from = sample.edges[i][0];
    let to = sample.edges[i][1];
    let weight = sample.edges[i][2];

    fetch("/api/edge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            source: from,
            destination: to,
            weight: weight,
            directed: sample.directed
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error)
            }
            else {
                edges = data.edges;

                if (!vertices.includes(from)) {
                    vertices.push(from);
                }
                if (!vertices.includes(to)) {
                    vertices.push(to);
                }
                addSampleEdge(sample, i + 1);
            }
        })
        .catch(error => {
            alert(error.message);
            sample_btn.disabled = false;
        });

}