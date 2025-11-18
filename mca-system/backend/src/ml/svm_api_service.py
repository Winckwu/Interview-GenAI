"""
SVM Pattern Classifier API Service

Flask microservice that provides SVM-based pattern classification
Listens on port 5002 and exposes REST endpoints
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import json
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple

app = Flask(__name__)
CORS(app)

# Load trained model and scaler
MODEL_DIR = Path(__file__).parent / 'models'

def load_model_artifacts():
    """Load SVM model, scaler, and metadata"""
    try:
        with open(MODEL_DIR / 'svm_model.pkl', 'rb') as f:
            svm_model = pickle.load(f)

        with open(MODEL_DIR / 'svm_scaler.pkl', 'rb') as f:
            scaler = pickle.load(f)

        with open(MODEL_DIR / 'pattern_mapping.json', 'r') as f:
            mapping = json.load(f)

        with open(MODEL_DIR / 'feature_names.json', 'r') as f:
            feature_names = json.load(f)

        return svm_model, scaler, mapping, feature_names
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return None, None, None, None


# Load artifacts on startup
SVM_MODEL, SCALER, PATTERN_MAPPING, FEATURE_NAMES = load_model_artifacts()

if SVM_MODEL is None:
    print("⚠️  Warning: SVM model not loaded. Service may not work correctly.")
else:
    print("✅ SVM Model loaded successfully")


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'svm-classifier',
        'model_loaded': SVM_MODEL is not None
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict pattern from behavioral signals

    Request body:
    {
        "signals": {
            "p1": 3,  # task_decomposition
            "p2": 2,  # goal_clarity
            "p3": 1,  # strategy
            ...
            "r2": 2   # trust_calibration
        }
    }

    Response:
    {
        "pattern": "A",
        "probability": 0.95,
        "probabilities": {"A": 0.95, "B": 0.03, ...},
        "confidence": 0.92  # margin between top 2
    }
    """
    try:
        if SVM_MODEL is None:
            return jsonify({'error': 'Model not loaded'}), 500

        data = request.get_json()
        if not data or 'signals' not in data:
            return jsonify({'error': 'Missing signals in request'}), 400

        signals = data['signals']

        # Extract features in correct order
        feature_order = ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2']
        features = np.array([[signals.get(f, 0) for f in feature_order]], dtype=float)

        # Scale features
        X_scaled = SCALER.transform(features)

        # Get prediction
        prediction = SVM_MODEL.predict(X_scaled)[0]
        pattern = PATTERN_MAPPING['id_to_pattern'][str(prediction)]

        # Get probability estimates
        decision_function = SVM_MODEL.decision_function(X_scaled)[0]
        probabilities = SVM_MODEL.predict_proba(X_scaled)[0]

        # Create probability dict
        prob_dict = {
            PATTERN_MAPPING['id_to_pattern'][str(i)]: float(probabilities[i])
            for i in range(len(probabilities))
        }

        # Sort by probability
        sorted_probs = sorted(prob_dict.items(), key=lambda x: x[1], reverse=True)
        top_prob = sorted_probs[0][1]
        second_prob = sorted_probs[1][1] if len(sorted_probs) > 1 else 0
        confidence = top_prob - second_prob

        return jsonify({
            'success': True,
            'pattern': pattern,
            'probability': float(top_prob),
            'probabilities': prob_dict,
            'confidence': float(confidence),
            'decision_scores': {PATTERN_MAPPING['id_to_pattern'][str(i)]: float(score) for i, score in enumerate(decision_function)}
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """
    Batch prediction for multiple signal sets

    Request body:
    {
        "signals_list": [
            {"p1": 3, "p2": 2, ...},
            {"p1": 0, "p2": 0, ...}
        ]
    }

    Response:
    {
        "results": [
            {"pattern": "A", "probability": 0.95, ...},
            {"pattern": "F", "probability": 0.98, ...}
        ]
    }
    """
    try:
        if SVM_MODEL is None:
            return jsonify({'error': 'Model not loaded'}), 500

        data = request.get_json()
        if not data or 'signals_list' not in data:
            return jsonify({'error': 'Missing signals_list in request'}), 400

        results = []
        feature_order = ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2']

        for signals in data['signals_list']:
            # Extract features
            features = np.array([[signals.get(f, 0) for f in feature_order]], dtype=float)

            # Scale and predict
            X_scaled = SCALER.transform(features)
            prediction = SVM_MODEL.predict(X_scaled)[0]
            pattern = PATTERN_MAPPING['id_to_pattern'][str(prediction)]

            # Get probabilities
            probabilities = SVM_MODEL.predict_proba(X_scaled)[0]
            prob_dict = {
                PATTERN_MAPPING['id_to_pattern'][str(i)]: float(probabilities[i])
                for i in range(len(probabilities))
            }

            sorted_probs = sorted(prob_dict.items(), key=lambda x: x[1], reverse=True)
            top_prob = sorted_probs[0][1]
            second_prob = sorted_probs[1][1] if len(sorted_probs) > 1 else 0

            results.append({
                'pattern': pattern,
                'probability': float(top_prob),
                'probabilities': prob_dict,
                'confidence': float(top_prob - second_prob)
            })

        return jsonify({
            'success': True,
            'results': results
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/model_info', methods=['GET'])
def model_info():
    """Get information about the loaded model"""
    return jsonify({
        'model_type': 'SVM (RBF kernel)',
        'feature_count': len(FEATURE_NAMES),
        'feature_names': FEATURE_NAMES,
        'patterns': list(PATTERN_MAPPING['id_to_pattern'].values()),
        'pattern_mapping': PATTERN_MAPPING,
        'support_vectors_count': len(SVM_MODEL.support_vectors_) if SVM_MODEL else 0,
        'classes': [PATTERN_MAPPING['id_to_pattern'][str(i)] for i in range(6)]
    })


if __name__ == '__main__':
    print("🚀 Starting SVM Pattern Classifier API Service")
    print("📍 Listening on http://localhost:5002")
    print("🔧 Endpoints:")
    print("   - GET  /health")
    print("   - GET  /model_info")
    print("   - POST /predict")
    print("   - POST /batch_predict")
    app.run(host='0.0.0.0', port=5002, debug=True)
