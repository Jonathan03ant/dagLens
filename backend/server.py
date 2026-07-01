import os
import subprocess
import tempfile
import glob
import re
from flask import Flask, jsonify
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

def run_llc(ir_code: str, stage: str):
    """
        Generates graph .dot file from LLVM IR
        llc path: user configured, or in PATH (TODO)
        -march: default amdgcn, later user defined (TODO)
        -mcpu: default gfx1101, later user defined (TODO)
    """

    with open('/tmp/input.ll', 'w') as f:
        f.write(ir_code)

    llc_path = "llc"
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