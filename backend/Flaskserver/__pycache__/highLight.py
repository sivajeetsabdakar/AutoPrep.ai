from flask import jsonify
from flask import Flask, request, jsonify
import os
from flask_cors import CORS
from nltk.tokenize import sent_tokenize ,word_tokenize
import fitz
import base64
from nltk.corpus import stopwords

def highLight(file , page_number):
 
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and file.filename.endswith('.pdf'):
        # Open the PDF file
        doc = fitz.open(stream=file.read(), filetype="pdf")

        # Check if the requested page number is valid
        if page_number < 0 or page_number >= len(doc):
            return jsonify({'error': 'Invalid page number'}), 400

        # Extract the text from the specified page
        page = doc[page_number-1]
        extracted_text = page.get_text()
        summarized_text = summarize_paragraph(extracted_text)

        # Highlight the summarized text on the PDF page and get the base64 image
        highlighted_image = image_extractor(summarized_text, page)

        return jsonify({
            'message': 'File uploaded and processed successfully',
            'highlighted_image': highlighted_image
        }), 200

    return jsonify({'error': 'Invalid file type'}), 400


def normalize_color(color):
    return tuple(c / 255.0 for c in color)
UPLOAD_FOLDER = 'uploads'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def image_to_base64_converter(image_path):
    """Convert an image file to a base64 string."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def image_extractor(array_of_text_to_highlight, page):
    # Highlight color: Purple (R: 128, G: 0, B: 128)
    highlight_color = normalize_color((255, 128, 64))

    for text_to_highlight in array_of_text_to_highlight:
        text_instances = page.search_for(text_to_highlight)

        for inst in text_instances:
            highlight = page.add_highlight_annot(inst)
            highlight.set_colors(stroke=highlight_color)
            highlight.update()

    # Generate a pixmap of the page after highlighting
    pix = page.get_pixmap()

    # Save the image to a temporary file
    output_image_path = os.path.join(UPLOAD_FOLDER, 'highlighted_page.png')
    pix.save(output_image_path)

    # Convert the saved image to a base64 string
    base64_image = image_to_base64_converter(output_image_path)
    
    # Clean up the temporary image file
    os.remove(output_image_path)

    return base64_image
keywords = [
    "is defined as","it depends on","perpendicular", "refers to", "can be described as", "known as", 
    "means", "is characterized by", "is identified by", "property", 
    "concept", "principle","named reaction","causes", "phenomenon", "law", "rule", 
    "theory", "axiom", "postulate", "term", "equals", 
    "is equivalent to", "expression", "equation", "formula", 
    "constant", "variable", "coefficient", "factor", "derivative", 
    "integral", "product", "sum", "difference", "quotient", 
    "function", "inverse", "ratio", "proportion", "relation", 
    "square root", "cube root", "logarithm", "exponent", "power"
]
def summarize_paragraph(paragraph):
    # Tokenize the paragraph into sentences
    sentences = sent_tokenize(paragraph)
    
    # Define stop words
    stop_words = set(stopwords.words('english'))
    
    # Create a set of keywords for quick lookup
    keyword_set = set(keyword.lower() for keyword in keywords)
    
    # Tokenize and clean sentences
    cleaned_sentences = []
    for sentence in sentences:
        words = word_tokenize(sentence.lower())
        filtered_words = [word for word in words if word.isalnum() and word not in stop_words]
        cleaned_sentences.append(filtered_words)
    
    # Extract sentences that contain any of the keywords
    relevant_sentences = [
        sentence for sentence, words in zip(sentences, cleaned_sentences)
        if keyword_set.intersection(words)
    ]
    print((relevant_sentences))
    return relevant_sentences