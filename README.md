
# 🩺 HealthAI – Medical Chatbot with RAG, Tuberculosis Detection & Cardiovascular Risk Prediction

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.11-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Gemini](https://img.shields.io/badge/Gemini-API-orange.svg)](https://ai.google.dev/gemini-api)

**HealthAI** is an integrated AI‑powered healthcare decision support system that combines a **Retrieval‑Augmented Generation (RAG) medical chatbot**, **tuberculosis detection from chest X‑rays**, and **cardiovascular risk prediction**.  
It is designed to address three major healthcare challenges in India: lack of access to specialists, misinformation, and limited diagnostic infrastructure.

- 🌐 **Web‑based** – works on any modern browser (Chrome, Edge, Firefox)
- 🎤 **Voice input** – supports English and Hindi (Web Speech API)
- 📄 **PDF upload** – ask questions about your own medical reports
- 🧠 **RAG pipeline** – answers are grounded in trusted medical PDFs with citations
- 🩻 **TB detection** – CNN model classifies chest X‑rays as Normal or Tuberculosis
- ❤️ **CVD risk** – XGBoost model predicts 10‑year coronary heart disease risk
- 📅 **Appointment booking** – multi‑turn conversation with `.ics` calendar export

---

## ✨ Features

| Module | Description |
|--------|-------------|
| **RAG Chatbot** | Ingests PDFs → chunks → sentence‑transformers embeddings (`all‑MiniLM‑L6‑v2`) → FAISS index → cosine similarity retrieval → Gemini synthesis. Returns answers with source citations. |
| **Voice Input** | Uses browser’s Web Speech API. Switch between English (`en-US`) and Hindi (`hi-IN`). |
| **PDF Upload** | Upload your own PDF; the chatbot answers **only** from that document (privacy‑first). |
| **Tuberculosis Detection** | CNN trained on Montgomery, Shenzhen, and Kaggle datasets. Input: chest X‑ray image (64×64 grayscale). Output: *Normal* or *Tuberculosis* with confidence. |
| **Cardiovascular Risk** | XGBoost model trained on Framingham Heart Study data (9 clinical features). Output: low/high risk and probability. SHAP explainability available. |
| **Appointment Booking** | Natural language slot filling (name, email, doctor, date, timezone). Generates an `.ics` calendar file. |

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | React 18, TypeScript, Vite 5, Tailwind CSS, shadcn/ui, TanStack Query, Web Speech API |
| **Backend** | FastAPI, Python 3.12, Uvicorn |
| **RAG** | pdfplumber, sentence-transformers (`all-MiniLM-L6-v2`), FAISS, Google Gemini API |
| **ML Models** | TensorFlow 2.20 (CNN), XGBoost 2.1, scikit-learn, SHAP, joblib |
| **Database** | SQLite (default) / PostgreSQL (optional) |
| **Deployment** | Docker, Render, PyInstaller (standalone `.exe`) |

---

## 📁 Project Structure
```
HealthChatbot/
├── python-backend/                 # FastAPI backend
│   ├── main.py                     # API routes, chat logic, lifespan
│   ├── rag.py                      # RAG system (chunking, embedding, FAISS)
│   ├── gemini_client.py            # Gemini API client with fallback models
│   ├── ehr_predictor.py            # CVD risk model (XGBoost)
│   ├── tb_predictor.py             # TB detection model (CNN)
│   ├── booking.py                  # Intent detection, slot filling, appointment creation
│   ├── ics_generator.py            # Generate .ics calendar files
│   ├── storage.py                  # In‑memory + SQLite storage
│   ├── models.py                   # Pydantic schemas
│   ├── path_utils.py               # Resource path helper (for PyInstaller)
│   ├── requirements.txt
│   ├── pdfs/                       # Pre‑loaded medical PDFs (NCCN, Cancer Council, etc.)
│   └── models/                     # ML model files (.pkl, .keras)
├── client/                         # React frontend source
│   ├── src/
│   ├── public/
│   └── package.json
├── shared/                         # Shared TypeScript types (used by frontend)
├── dist/                           # Built frontend (created by `npm run build`)
├── .env.example                    # Environment variables template
├── render.yaml                     # Render.com deployment configuration
├── Dockerfile                      # Docker image definition
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.12+** and `pip`
- **Node.js 18+** and `npm`
- **Google Gemini API key** – obtain from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/HealthChatbot.git
cd HealthChatbot
```

### 2. Set up the backend

```bash
cd python-backend
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Set up the frontend

```bash
cd ../client
npm install
npm run build                    # Creates ../dist/public
```

### 4. Configure environment

Create a `.env` file in the **project root** (the folder that contains `python-backend`, `client`, etc.). Use the template:

```
GEMINI_API_KEY=your_api_key_here
DATABASE_URL=sqlite:///./healthchat.db
PDF_FOLDER=pdfs
```

### 5. Start the application

From the project root:

```bash
cd python-backend
uvicorn main:app --reload --port 5000
```

Open `http://localhost:5000` in your browser.

---

## 📱 Usage Guide

### 💬 Chat with the Bot

- Type your health question in the chat box.
- Click the **microphone** button to speak (English or Hindi).
- The bot will answer using the pre‑loaded medical PDFs and show **citations** like `[NCCN-BC-001]`.
- If no relevant PDF content is found, it falls back to Gemini (general knowledge).

### 📄 Upload a PDF

- Click the **📎 button**.
- Select a PDF (medical report, handbook, etc.).
- After upload, the bot answers **only** from that PDF. It will ignore global PDFs.
- If the answer is not in the uploaded PDF, the bot returns a friendly welcome message (not a Gemini answer).

### 🩻 Tuberculosis Detection

- Navigate to `/tb-prediction`.
- Upload a chest X‑ray image (PNG, JPG, JPEG).
- The model returns **Normal** or **Tuberculosis** with confidence percentage.

### ❤️ Cardiovascular Risk Prediction

- Navigate to `/ehr-prediction`.
- Enter the following 9 clinical values:
  - Age, Gender (1 = male, 0 = female), Cigarettes per day, Total cholesterol (mg/dL), Systolic BP (mm Hg), Diastolic BP (mm Hg), BMI, Heart rate (bpm), Glucose (mg/dL)
- The model returns **Low risk** or **High risk** of CHD in 10 years, plus confidence.

### 📅 Book an Appointment

- Type: *“I want to book an appointment”* or *“Book appointment with a cardiologist”*.
- Follow the multi‑turn conversation (name, email, doctor, date, timezone).
- After confirmation, an `.ics` calendar file is generated.

---

## 🔌 API Endpoints (selected)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | `POST` | Send a message, receive bot response with citations. |
| `/api/upload-pdf` | `POST` | Upload a PDF for a specific conversation. |
| `/api/predict/ehr` | `POST` | JSON with 9 features → CVD risk prediction. |
| `/api/predict/tb` | `POST` | Upload image file → TB classification. |
| `/api/doctors` | `GET` | List of available doctors. |
| `/api/appointments` | `POST` | Create an appointment (used internally by booking flow). |
| `/api/appointments/{id}/ics` | `GET` | Download `.ics` calendar file. |
| `/api/conversations` | `GET` / `POST` | List or create conversations. |
| `/api/messages/{conversationId}` | `GET` | Get all messages of a conversation. |

Detailed OpenAPI documentation is available at `http://localhost:5000/docs` when the server is running.

---

## 🧪 Evaluation Metrics

The chatbot was evaluated on 50 cancer‑related queries and 10 off‑topic queries.

| Metric | Value |
|--------|-------|
| Retrieval Success Rate (citations present when expected) | 89% |
| Average Response Time | 4.2 seconds |
| Non‑Health Query Accuracy (fixed response) | 100% |

TB detection (20% held‑out test set):
- Accuracy: 96.2%
- Sensitivity: 94.8%
- Specificity: 97.5%
- AUC: 0.989

CVD risk (XGBoost on Framingham):
- AUC: 0.86
- Accuracy: 85.2%
- Recall: 0.85

---

## 🐳 Deployment Options

### Render (cloud – easiest)

1. Push the repository to GitHub.
2. Create a `render.yaml` in the root (provided in the repo).
3. Connect your GitHub account on [render.com](https://render.com) → New Web Service → use the YAML.
4. Render will automatically deploy both backend and frontend.  
   The frontend will be available at a public URL.

### Docker

```bash
docker build -t health-chatbot .
docker run -p 5000:5000 health-chatbot
```

### Standalone `.exe` (Windows)

Build with PyInstaller (see `pyinstaller` command in the documentation). The recipient needs only the `.exe` and a `.env` file.

---

## 🙏 Acknowledgements

- **Datasets**: Framingham Heart Study, Montgomery County TB X‑ray, Shenzhen Hospital TB X‑ray, Kaggle TB Chest X‑ray.
- **Libraries**: Hugging Face (sentence-transformers), FAISS, TensorFlow, XGBoost, SHAP, FastAPI, React, Vite, Tailwind CSS, shadcn/ui.
- **APIs**: Google Gemini API, Web Speech API.
- **Inspiration**: India’s National TB Elimination Programme (NTEP 2025) and Ayushman Bharat Digital Mission (ABDM).

---

## 👥 Contributors

- **Pratham** – Backend, RAG pipeline, frontend, voice input, integration.
- **Harshil** – TB detection CNN, CVD risk XGBoost model, SHAP analysis.

---

## 📞 Contact

For questions or contributions, please open an issue on GitHub or contact the maintainers.

---

*Built with ❤️ for better healthcare accessibility.*

