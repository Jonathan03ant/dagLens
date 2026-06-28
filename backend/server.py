from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'message': 'DagLens Python API is running'
    })



if __name__ == '__main__':
    print('DagLens server starting on http://localhost:8080')
    app.run(host='0.0.0.0', port=8080, debug=True)