import base64
import io
import os
from PIL import Image
from flask import jsonify
from textextract import TextExtractor, OS
def fix_base64_padding(base64_string: str) -> str:
    """Add padding to the base64 string if necessary."""
    if missing_padding := len(base64_string) % 4:
        base64_string += '=' * (4 - missing_padding)
    return base64_string

def decode_base64_to_image(base64_string: str, output_path: str) -> None:
    """Decode a base64 string and save it as an image file."""
    try:
        # Remove the data URI scheme part if present
        if base64_string.startswith('data:image'):
            base64_string = base64_string.split(',')[1]
        
        # Fix base64 padding
        base64_string = fix_base64_padding(base64_string)
        
        # Print the cleaned base64 string for debugging
        print(f"Base64 string after removing prefix: {base64_string[:30]}...")

        # Decode the base64 string
        image_data = base64.b64decode(base64_string)
        
        # Convert binary data to an image
        image = Image.open(io.BytesIO(image_data))
        
        # Save the image to a file
        image.save(output_path)
        print(f"Image saved successfully at {output_path}")
    except Exception as e:
        print(f"Error decoding or saving image: {e}")

def main(base64_string: str) -> str:
    # Path where the decoded image will be saved
    image_path = 's1.png'
    
    # Decode the base64 string and save the image
    decode_base64_to_image(base64_string, image_path)
    
    # Check if the image was saved correctly
    if not os.path.exists(image_path):
        print(f"Error: Image not found at {image_path}")
        return ""
    
    # Create an instance of TextExtractor
    extractor = TextExtractor()
   
    # Extract text from the image
    try:
        extracted_text = extractor.extract_text(image_path)
        if not isinstance(extracted_text, str):
            extracted_text = str(extracted_text)
    except Exception as e:
        print(f"Error extracting text: {e}")
        return ""
    
    # Optionally, clean up the image file after processing
    if os.path.exists(image_path):
        os.remove(image_path)
    
    return extracted_text