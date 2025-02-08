import platform
from PIL import Image
from pytesseract import pytesseract
import enum
import os

class OS(enum.Enum):
    Mac = "Mac"
    Windows = "Windows"
    Linux = "Linux"
    Docker = "Docker"

class Lang(enum.Enum):
    ENG = "eng"

class TextExtractor:
    def __init__(self):
        os_type = self._detect_os()
        print(f"Running on {os_type.value}")
        self.os_type = os_type

        if os_type == OS.Windows:
            print("Setting up Tesseract for Windows.")
            windows_path = os.path.join(os.path.dirname(__file__), "../tools/tesseract/tesseract.exe")
            if not os.path.exists(windows_path):
                raise FileNotFoundError(f"Tesseract not found at {windows_path}. Please install it and provide the correct path.")
            
            pytesseract.tesseract_cmd = windows_path
            print(f"Tesseract path set to {windows_path}")

        elif os_type in [OS.Linux, OS.Docker]:
            print(f"Setting up Tesseract for {os_type.value}. Assuming Tesseract is installed in the PATH environment variable.")
            if not self._is_tesseract_available():
                raise EnvironmentError("Tesseract is not installed or not available in the PATH. Make sure Tesseract is installed.")
        
        elif os_type == OS.Mac:
            print("Setting up Tesseract for Mac. Assuming Tesseract is installed in the PATH environment variable.")

    def _detect_os(self) -> OS:
        """Automatically detects the operating system."""
        system = platform.system()
        if system == "Windows":
            return OS.Windows
        elif system == "Linux":
            # Check if running in Docker
            return OS.Docker if os.path.exists("/.dockerenv") else OS.Linux
        elif system == "Darwin":
            return OS.Mac
        else:
            raise EnvironmentError(f"Unsupported operating system: {system}")

    def _is_tesseract_available(self):
        """Check if Tesseract is accessible from the PATH."""
        return os.system("which tesseract") == 0

    def extract_text(self, image_path: str) -> str:
        """Extract text from the given image."""
        try:
            img = Image.open(image_path)
            return pytesseract.image_to_string(img, lang=Lang.ENG.value)
        except FileNotFoundError:
            return f"Image file not found: {image_path}"
        except Exception as e:
            return f"Error occurred: {str(e)}"
