from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
import pickle
import os

app = Flask(__name__)

# Firebase initialization
cred = credentials.Certificate("../firebase/firebase_service_key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Load model
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
with open(MODEL_PATH, 'rb') as f:
    model = pickle.load(f)

@app.route('/predict_instructor', methods=['POST'])
def predict_instructor_courses():
    data = request.json
    instructor_uid = data.get('uid')
    if not instructor_uid:
        return jsonify({"error": "No instructor UID provided"}), 400

    # Firestore'dan instructor bilgisi
    inst_ref = db.collection('instructors').document(instructor_uid)
    inst_doc = inst_ref.get()
    if not inst_doc.exists:
        return jsonify({"error": "Instructor not found"}), 404

    instructor_data = inst_doc.to_dict()
    instructor_name = instructor_data.get('name', '').lower()
    past_courses_codes = instructor_data.get('pastcourses', [])

    # Tüm dersleri çek
    courses_ref = db.collection('courses')
    courses_docs = courses_ref.stream()
    courses_list = []
    for c in courses_docs:
        cdata = c.to_dict()
        if ('instructor' in cdata and 'course_code' in cdata and
            instructor_name in cdata['instructor'].lower() and
            cdata['course_code'] in past_courses_codes):
            courses_list.append(cdata)

    # Model feature isimleri
    feature_cols = model.feature_names_in_ if hasattr(model, 'feature_names_in_') else []

    # Dataframe oluştur
    import pandas as pd
    df = pd.DataFrame(courses_list)
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0  # Eksik feature'ları 0 ile doldur

    X = df[feature_cols]

    # Tahmin yap
    preds = model.predict(X).tolist()

    # Tahminleri courses_list ile birleştir
    for i in range(len(courses_list)):
        courses_list[i]['prediction'] = preds[i]

    return jsonify(courses_list)

if __name__ == '__main__':
    app.run(debug=True)
