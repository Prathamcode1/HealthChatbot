# ehr_predictor.py
import joblib
import numpy as np
import os

class EHRPredictor:
    def __init__(self):
        base_path = os.path.dirname(__file__)
        self.model = joblib.load(os.path.join(base_path, 'models', 'ehr_model.pkl'))
        self.scaler = joblib.load(os.path.join(base_path, 'models', 'ehr_scaler.pkl'))
        self.feature_names = joblib.load(os.path.join(base_path, 'models', 'ehr_columns.pkl'))
    
    def predict(self, input_dict):
        X = np.array([[input_dict[name] for name in self.feature_names]])
        X_scaled = self.scaler.transform(X)
        pred = self.model.predict(X_scaled)[0]
        prob = self.model.predict_proba(X_scaled)[0][pred]
        return int(pred), float(prob)

# Global instance
_predictor = None

def init_ehr_predictor():
    global _predictor
    _predictor = EHRPredictor()
    print("EHR predictor loaded")

def get_ehr_predictor():
    return _predictor