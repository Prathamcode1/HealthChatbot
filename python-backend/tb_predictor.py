# tb_predictor.py
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

class TBPredictor:
    def __init__(self):
        base_path = os.path.dirname(__file__)
        model_path = os.path.join(base_path, 'models', 'best_model_epoch.keras')
        self.model = tf.keras.models.load_model(model_path)
        self.class_names = ['Normal', 'Tuberculosis']

    def predict(self, image_bytes):
        img = Image.open(io.BytesIO(image_bytes)).convert('L')
        img = img.resize((64, 64))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        img_array = np.expand_dims(img_array, axis=-1)

        output = self.model.predict(img_array)
        if output.shape[-1] == 1:
            prob = float(output[0][0])
            pred_class = 1 if prob > 0.5 else 0
            confidence = prob if pred_class == 1 else 1 - prob
        else:
            probs = output[0]
            pred_class = int(np.argmax(probs))
            confidence = float(probs[pred_class])
        label = self.class_names[pred_class]
        return {"prediction": label, "confidence": confidence}

# Global instance
_tb_predictor = None

def init_tb_predictor():
    global _tb_predictor
    _tb_predictor = TBPredictor()
    print("TB predictor loaded")

def get_tb_predictor():
    return _tb_predictor