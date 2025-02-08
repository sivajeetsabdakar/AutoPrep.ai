# text_extractor.py

from PIL import Image
from pytesseract import pytesseract
import enum
import os

class OS(enum.Enum):
    Mac = "Mac"
    Window = "Window"

class Lang(enum.Enum):
    ENG = "eng"
    # Add more languages as needed

class TextExtractor:
    def __init__(self, os_type: OS):
        print(f"Running on {os_type.value}")
        
        if os_type == OS.Window:
            print(1)
            windows_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
            if os.path.exists(windows_path):
                print(2)
                pytesseract.tesseract_cmd = windows_path
            else:
                raise FileNotFoundError(f"Tesseract not found at {windows_path}. Please install it and provide the correct path.")
        
        elif os_type == OS.Mac:
            print("Assuming Tesseract is installed in the PATH environment variable on Mac.")
            # Add Mac-specific configuration if needed

    def extract_text(self, image_path: str) -> str:
        try:
            img = Image.open(image_path)
            extracted_text = pytesseract.image_to_string(img, lang=Lang.ENG.value)
            return extracted_text
        except Exception as e:
            return f"Error occurred: {e}"
