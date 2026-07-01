import os
import subprocess
import glob
import re
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DAG_STAGE_FLAGS = {
    'dag-combine1': '-view-dag-combine1-dags',    # After build, before first optimization pass
    'legalize': '-view-legalize-dags',            # Before legalization (after dag-combine1)
    'dag-combine2': '-view-dag-combine2-dags',    # Before second optimization pass (after legalization)
    'isel': '-view-isel-dags',                    # Before instruction selection (after dag-combine2)
    'sched': '-view-sched-dags'                   # Before scheduling (after instruction selection)
}

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'message': 'DagLens Python API is running'
    })

@app.route('/api/compile', methods=['POST'])
def compile_endpoint():
    """
    Receives LLVM IR code and DAG stage, compiles and returns graph data.
    """
    try:
        data = request.get_json()
        ir_code = data.get('ir_code', '')
        stage = data.get('stage', 'isel')

        # Validate inputs
        if not ir_code:
            return jsonify({'error': 'No IR code provided'}), 400
        if stage not in DAG_STAGE_FLAGS:
              return jsonify({'error': f'Invalid stage: {stage}'}), 400

        dot_file_path = run_llc(ir_code, stage)
        graph_data = parse_dot(dot_file_path)

        return jsonify(graph_data)

    except subprocess.CalledProcessError as e:
        return jsonify({'error': f'llc compilation failed: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

def run_llc(ir_code: str, stage: str):
    """
        Generates graph .dot file from LLVM IR
        llc path: user configured, or in PATH (TODO)
        -march: default amdgcn, later user defined (TODO)
        -mcpu: default gfx1101, later user defined (TODO)
    """

    with open('/tmp/input.ll', 'w') as f:
        f.write(ir_code)

    llc_path = "/utg/TheRockDogFooding/TheRock/compiler/amd-llvm/build-debug/bin/llc"
    flag = DAG_STAGE_FLAGS[stage]

    cmd = [
        llc_path,
        '-march=amdgcn',      # TODO: make configurable
        '-mcpu=gfx1101',      # TODO: make configurable
        '/tmp/input.ll',
        flag,
        '-o', '/dev/null'  # Don't generate assembly, just .dot
    ]

    subprocess.run(cmd, check=True)

    dot_files = glob.glob('/tmp/dag.*.dot')
    dot_files.sort(key=os.path.getmtime, reverse=True)
    dot_file = dot_files[0]

    return dot_file

def extract_label(line: str):
    """
    Extract the label content from a node definition line.
    Input:  'Node0x5bea79575b90 [shape=record,shape=Mrecord,label="{EntryToken|t0|{<d0>ch|<d1>glue}}"];'
    Output: '{EntryToken|t0|{<d0>ch|<d1>glue}}'
    """
    match = re.search(r'label="([^"]+)"', line)
    if match:
        return match.group(1)
    return ""

def parse_label(label: str):
    """
    Parse the label to extract opcode, node number, and output type.
    Examples:
    "{EntryToken|t0|{<d0>ch|<d1>glue}}" → ("EntryToken", "t0", "ch")
    "{Register %8|t1|{<d0>i32}}" → ("Register %8", "t1", "i32")
    "{{<s0>0|<s1>1}|add|t6|{<d0>i32}}" → ("add", "t6", "i32")
    """
    # Pattern 1: Simple node {Opcode|tN|{outputs}}
    # Example: {EntryToken|t0|{<d0>ch|<d1>glue}}
    match = re.match(r'\{([^{|]+)\|t(\d+)\|.*?<d\d+>([^}|]+)', label)
    if match:
        return (match.group(1), f"t{match.group(2)}", match.group(3))

    # Pattern 2: Node with inputs {{inputs}|Opcode|tN|{outputs}}
    # Example: {{<s0>0|<s1>1}|add|t6|{<d0>i32}}
    match = re.match(r'\{\{.*?\}\|([^|]+)\|t(\d+)\|.*?<d\d+>([^}|]+)', label)
    if match:
        return (match.group(1), f"t{match.group(2)}", match.group(3))

    # Fallback: return label as-is
    return (label, "t?", "?")

def parse_dot(dot_file_path: str):
    """
        # Opens the .dot file
        # Parses the GraphViz DOT syntax
        # Extracts:
        #   - Nodes: {id, label (opcode), type, etc.}
        #   - Edges: {source, target, type}
    # Returns: JSON structure for React Flow
    """
    nodes = []
    edges = []

    with open(dot_file_path, "r") as f:
        for line in f:
            if '[shape=record' in line:
                # This is a node definition
                node_id = line.split()[0]                               # Node0x5bea79575b90
                label = extract_label(line)                             # label="{EntryToken|t0|{<d0>ch|<d1>glue}}"];
                opcode, node_num, output_type = parse_label(label)
                nodes.append({
                    "id": node_id,
                    "position": {"x": 0, "y": 0},
                    "data": {
                        "label": opcode,
                        "opcode": opcode,
                        "node_num": node_num,
                        "output_type": output_type
                    }
                })
            elif '->' in line:
                # This is an edge
                parts = line.split('->')
                source = parts[0].split(':')[0].strip()                 # "Node0x5bea79575b90"
                target = parts[1].split(':')[0].strip()                 # "Node0x5bea7969a410"

                is_chain = 'color=blue' in line

                edges.append({
                    "id": f"{source}->{target}",
                    "source": source,
                    "target": target,
                    "type": "chain" if is_chain else "data"
                })

    return {"nodes": nodes, "edges": edges}

if __name__ == '__main__':
    print('DagLens server starting on http://localhost:8080')
    app.run(host='0.0.0.0', port=8080, debug=True)