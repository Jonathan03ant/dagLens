import os
import sys
import datetime
import subprocess
from flask import Flask, jsonify, request
from flask_cors import CORS

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib.compiler import run_llc, DAG_STAGE_FLAGS
from lib.parser import parse_dot
from lib.utils import kill_port_8080

app = Flask(__name__)
CORS(app)

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
        llc_path = data.get('llc_path', 'llc')

        # Validate inputs
        if not ir_code:
            return jsonify({'error': 'No IR code provided'}), 400
        if stage not in DAG_STAGE_FLAGS:
              return jsonify({'error': f'Invalid stage: {stage}'}), 400

        dot_file_path, terminal_output = run_llc(ir_code, stage, llc_path)
        graph_data = parse_dot(dot_file_path)

        return jsonify({
            **graph_data,
            "terminal_output": terminal_output
        })

    except subprocess.CalledProcessError as e:
        import traceback
        traceback.print_exc()
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        terminal_output = [
            {"type": "command", "text": f"llc -march=amdgcn -mcpu=gfx1101 ...", "timestamp": timestamp},
            {"type": "error", "text": f"✗ llc compilation failed: {str(e)}", "timestamp": timestamp}
        ]
        return jsonify({'error': f'llc compilation failed: {str(e)}', 'terminal_output': terminal_output}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        terminal_output = [
            {"type": "error", "text": f"✗ Error: {str(e)}", "timestamp": timestamp}
        ]
        return jsonify({'error': f'Server error: {str(e)}', 'terminal_output': terminal_output}), 500

if __name__ == '__main__':
    # Only kill port on initial startup, not on Flask reloader restart
    if os.environ.get('WERKZEUG_RUN_MAIN') != 'true':
        kill_port_8080()
    print('DagLens server starting on http://localhost:8080')
    app.run(host='0.0.0.0', port=8080, debug=True)
