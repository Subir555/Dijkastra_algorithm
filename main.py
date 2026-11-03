from flask import Flask, render_template, request, jsonify
import heapq
import string

app = Flask(
    __name__,
    template_folder="Frontend",
    static_folder="Static"
)

graph = {}
vertex_count = 0
directed_pairs = set()



def valid_name(name):
    return (
        isinstance(name, str)
        and name.isascii()
        and name.isalpha()
    )                       


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/vertices", methods=["POST"])
def set_vertices():
    global graph, vertex_count,directed_pairs

    data = request.get_json(silent=True) or {}
    count = data.get("count")

    if isinstance(count, bool) or not isinstance(count, int):
        return jsonify({"error": "Enter a valid whole number."}), 400

    if count < 1 or count > 26:
        return jsonify({
            "error": "Enter a number between 1 and 26."
        }), 400

    vertex_count = count
    
    #names = list(string.ascii_uppercase[:count])
    #graph = {name: {} for name in names}
    graph = {}
    directed_pairs = set()


    return jsonify({
        "message": f"{count} vertices are available.",
        "vertices": [],
        "edges": []
    })


@app.route("/api/edge", methods=["POST"])
def add_edge():
    global directed_pairs

   
    data = request.get_json(silent=True) or {}
    directed = bool(data.get("directed",False))
    
    source = data.get("source", "")
    destination = data.get("destination", "")
    weight = data.get("weight")

    if not isinstance(source, str) or not valid_name(source):
        return jsonify({
            "error": "Source vertex must contain letters only."
        }), 400

    if not isinstance(destination, str) or not valid_name(destination):
        return jsonify({
            "error": "Destination vertex must contain letters only."
        }), 400

    source = source.upper()
    destination = destination.upper()

    if  vertex_count == 0:
        return jsonify({
            "error": "Set the number of vertices first."
        }), 400

    #if source not in graph or destination not in graph:
        #return jsonify({
            #"error": "Invalid vertex. Check the available vertices."
        #}), 400

    if source == destination:
            return jsonify({
                "error": "An edge cannot connect a vertex to itself."
            }), 400
    
    if isinstance(weight, bool) or not isinstance(weight, (int, float)):
            return jsonify({
                "error": "Weight must be a number."
            }), 400
    
    if weight < 0:
            return jsonify({
                "error": "Weight cannot be negative in Dijkstra's algorithm."
            }), 400

    
    new_vertices = []

    if source not in graph :
        new_vertices.append(source)

    if destination not in graph and destination != source:
        new_vertices.append(destination)

    if len(graph) + len(new_vertices) > vertex_count :
        return jsonify({
            "error" : f"only {vertex_count} vertices are allowed"
        }),400

    for vertex in new_vertices:
        graph[vertex] = {}

    

    graph[source][destination] = weight
    if directed :
        graph[destination].pop(source,None)
        directed_pairs.add((source,destination))
    else :
        graph[destination][source] = weight

    return jsonify({
        "message": f"Edge {source} - {destination} added successfully.",
        "edges": get_edges()
    })


def get_edges():
    edges = []

    for source in graph:
        for destination, weight in graph[source].items():
           # if source < destination:
           #     edges.append({
           #         "from": source,
           #         "to": destination,
           #         "weight": weight
           #     })
           if(source,destination) in directed_pairs:
               edges.append({"from" : source, "to" : destination,
                             "weight" : weight,"directed" : True})
            
           elif(source < destination) :
               edges.append({"from" : source, "to" : destination,
                             "weight" : weight, "directed" : False})

    return edges


@app.route("/api/shortest-path", methods=["POST"])
def shortest_path():
    data = request.get_json(silent=True) or {}
    source = data.get("source", "")

    if not isinstance(source, str) or not valid_name(source):
        return jsonify({
            "error": "Source vertex must contain letters only."
        }), 400

    source = source.upper()

    if source not in graph:
        return jsonify({
            "error": "Invalid source vertex."
        }), 400

    distances = {vertex: float("inf") for vertex in graph}
    parents = {vertex: None for vertex in graph}
    visited = set()
    distances[source] = 0

    queue = [(0, source)]
    steps = []

    while queue:
        current_distance, current = heapq.heappop(queue)

        if current in visited:
            continue

        visited.add(current)

        updates = []

        for neighbor, weight in graph[current].items():
            if neighbor in visited:
                continue

            new_distance = current_distance + weight

            if new_distance < distances[neighbor]:
                old_distance = distances[neighbor]
                distances[neighbor] = new_distance
                parents[neighbor] = current
                heapq.heappush(queue, (new_distance, neighbor))

                updates.append({
                    "vertex": neighbor,
                    "old": old_distance if old_distance != float("inf") else None,
                    "new": new_distance
                })

        steps.append({
            "current": current,
            "distance": current_distance,
            "visited": sorted(visited),
            "updates": updates,
            "distances": {
                vertex: (
                    distance if distance != float("inf") else None
                )
                for vertex, distance in distances.items()
            }
        })

    paths = {}

    for vertex in graph:
        if distances[vertex] == float("inf"):
            paths[vertex] = {
                "distance": None,
                "path": [],
                "display": "No path"
            }
            continue

        path = []
        current = vertex

        while current is not None:
            path.append(current)
            current = parents[current]

        path.reverse()

        paths[vertex] = {
            "distance": distances[vertex],
            "path": path,
            "display": " -> ".join(path)
        }

    return jsonify({
        "source": source,
        "vertices": list(graph.keys()),
        "edges": get_edges(),
        "steps": steps,
        "distances": {
            vertex: (
                distance if distance != float("inf") else None
            )
            for vertex, distance in distances.items()
        },
        "paths": paths
    })


@app.route("/api/clear", methods=["POST"])
def clear_graph():
    global graph, vertex_count,directed_pairs

    graph = {}
    vertex_count = 0
    directed_pairs = set()

    return jsonify({"message": "Graph cleared successfully."})


@app.route('/about')
def about():
    return render_template('about_us.html')

if __name__ == "__main__":
    app.run(debug=True)
