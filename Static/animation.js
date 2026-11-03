
(function(){
    const GREEN = "#169645";
    const EDGE_TIME = 900;  
    const NODE_TIME = 500;   
    const PAUSE_TIME = 450;  

    let animToken = 0; 

function resetAnimation(){
    stopAnimation();
    visitedVertices = [];
    drawGraph();

    distance_table.innerHTML = "";
    shortest_path.innerHTML = "";
    step_log.innerHTML = "";
}
   const sleep = ms => new Promise(res=>setTimeout(res, ms));

    function stopAnimation(){
        animToken++;
    }

    function resetAnimation(){
    stopAnimation();

    window.algorithmAlreadyRun = false;

    visitedVertices = [];
    drawGraph();

    distance_table.innerHTML = "";
    shortest_path.innerHTML = "";
    step_log.innerHTML = "";
}

    function getPositions(){
        const pos = {};
        vertices.forEach((v, i) => {
            const angle = (2 * Math.PI * i / vertices.length) - Math.PI / 2;
            pos[v] = {
                x: 350 + 260 * Math.cos(angle),
                y: 240 + 170 * Math.sin(angle)
            };
        });
        return pos;
    }

    function findEdge(parent, child){
        return edges.find(e =>
            (e.from === parent && e.to === child) ||
            (!e.directed && e.from === child && e.to === parent)
        );
    }

function animateEdge(svg, p1, p2, ms){
  const svgns = "http://www.w3.org/2000/svg";
  const length = Math.hypot(p2.x - p1.x, p2.y - p1.y);

  const line = document.createElementNS(svgns, "line");

  line.setAttribute("x1", p1.x);
  line.setAttribute("y1", p1.y);
  line.setAttribute("x2", p2.x);
  line.setAttribute("y2", p2.y);

  line.style.stroke = GREEN;
  line.style.strokeWidth = "4.1";
  line.style.strokeLinecap = "round";
  line.style.opacity = "1";
  line.style.strokeOpacity = "1";
  line.style.fill = "none";
  line.style.pointerEvents = "none";
  line.style.strokeDasharray = `${length}`;
  line.style.strokeDashoffset = `${length}`;

  svg.appendChild(line);

  const foreground = Array.from(svg.children).filter(element =>
    ["circle", "text"].includes(element.localName)
  );

  foreground.forEach(element=>svg.appendChild(element));
  line.getBoundingClientRect();

  line.style.transition =
    `stroke-dashoffset ${ms}ms ease-in-out`;

  line.style.strokeDashoffset="0";
  return sleep(ms);
}

function colorVertex(circle, ms){
    circle.style.transition = `fill ${ms}ms ease`;
    circle.style.fill = GREEN;
    return sleep(ms);
}

function addLog(text){
    const row = document.createElement("div");
    row.innerHTML = text;
    row.style.cssText =
    "padding:8px 12px;border-bottom:1px solid #e9edf3;font-size:14px;" +
    "opacity:0;transform:translateY(6px);transition:all .35s ease;";
    step_log.appendChild(row);
    row.getBoundingClientRect();
    row.style.opacity = "1";
    row.style.transform = "translateY(0)";
    step_log.scrollTop = step_log.scrollHeight;
    }

    function fillPathTable(data){
        shortest_path.innerHTML = "";
        const order = [data.source, ...vertices.filter(v => v !== data.source)];
        order.forEach(vertex => {
            const row = document.createElement("tr");
            const c1 = document.createElement("td");
            c1.textContent = vertex;
            const c2 = document.createElement("td");
            c2.textContent = data.paths[vertex] ? data.paths[vertex].display : "Path not available";
            row.appendChild(c1);
            row.appendChild(c2);
            shortest_path.appendChild(row);
        });
    }

    window.displayData = async function (data){
        if (window.algorithmAlreadyRun){
        const reset = confirm("Please Reset Your Graph");
        return reset;
        if (!reset){
            return;
        }
    }

    window.algorithmAlreadyRun = true;
        stopAnimation();
        const myToken = animToken;

        visitedVertices = [];
        drawGraph();                          
        shortest_path.innerHTML = "";
        step_log.innerHTML = "";

        const svg = graph_canvas.querySelector("svg");
        const circles = svg.querySelectorAll("circle");
        const pos = getPositions();
        const initial = {};
        vertices.forEach(v => initial[v] = null);
        initial[data.source] = 0;
        updateDistanceTable(data, { distances: initial, visited: [] });

        await sleep(300);

        for (let i = 0; i < data.steps.length; i++){
            if (myToken !== animToken) return;     
            const step = data.steps[i];
            const current = step.current;
            const path = data.paths[current].path;
            if (path.length > 1){
                const parent = path[path.length - 2];
                if (findEdge(parent, current)) {
                    await animateEdge(svg, pos[parent], pos[current], EDGE_TIME);
                    if (myToken !== animToken) return;
                }
            }

            await colorVertex(circles[vertices.indexOf(current)], NODE_TIME);
            if (myToken !== animToken) return;
            visitedVertices = step.visited.slice();
            updateDistanceTable(data, step);

            let msg = `<b>Step ${i + 1}:</b> Visit <b>${current}</b> (distance ${step.distance}).`;
            if (step.updates.length) {
                const ups = step.updates.map(u =>
                    `${u.vertex}: ${u.old === null ? "\u221E" : u.old} \u2192 ${u.new}`
                ).join(", ");
                msg += ` Updated: ${ups}`;
            } else {
                msg += " No updates.";
            }
            addLog(msg);

            await sleep(PAUSE_TIME);
        }

        if (myToken !== animToken) return;
        fillPathTable(data);
        addLog("<b>Done.</b> Shortest paths found.");
    };

    
document.getElementById("cleargraph").addEventListener("click", resetAnimation);
document.getElementById("samplebtn").addEventListener("click", resetAnimation);
document.getElementById("resetbtn").addEventListener("click", resetAnimation);
document.getElementById("vertexcount").addEventListener("keydown", e => {
    if (e.key === "Enter") {
        resetAnimation();
    }
});
document.getElementById("addedge").addEventListener("click", resetAnimation);

})();


