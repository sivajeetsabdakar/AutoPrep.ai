from flask import Flask, request, jsonify
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

def phy_data(file,paragraph):
   

    # Load the CSV file
    df = pd.read_csv(file)
    
    # Extract necessary columns
    questions = df['question']
    images = df['image']
    answers = df['ans']
   

    # Preprocess the input text and questions
    def preprocess(text):
        tokens = nltk.word_tokenize(text)
        return ' '.join(tokens)

    preprocessed_questions = [preprocess(str(question)) for question in questions]
    preprocessed_paragraph = preprocess(paragraph)

    # Calculate TF-IDF vectors and cosine similarity
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform(preprocessed_questions + [preprocessed_paragraph])
    similarity_matrix = cosine_similarity(vectors[-1], vectors[:-1])

    # Sort and filter the results based on the similarity scores
    threshold = 0.2 
    sorted_indices = similarity_matrix[0].argsort()[::-1]
    sorted_questions = [(i, questions[i], similarity_matrix[0][i]) for i in sorted_indices]

    top_n = 10
    response = {}
    suggestions = []
    
    # Prepare the response with the top N suggestions including question, image, and answer
    for i, (index, question, score) in enumerate(sorted_questions[:top_n], 1):
        if score > threshold:
            suggestions.append({
                "question": question,
                "score": score,
                "ans": answers[index],
                "image": images[index]
            })

    # Return the suggestions or a message if no relevant data is found
    if suggestions:
        response['suggestions'] = suggestions
    else:
        response['message'] = "No related data found"

    return jsonify(response)
