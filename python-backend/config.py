import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
PDF_FOLDER = os.getenv("PDF_FOLDER", "pdfs")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./healthchat.db")   # not used for uploads
DOCTORS_CSV = os.getenv("DOCTORS_CSV", "../attached_assets/doctors_300_dataset_1763920263351.csv")