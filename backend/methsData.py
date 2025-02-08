from flask import jsonify
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd


def check_paragraph_similarity(paragraph, df):

    vectorizer = TfidfVectorizer()

    documents = [paragraph] + df['Tokens'].tolist()

    tfidf_matrix = vectorizer.fit_transform(documents)

    cosine_similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])

    most_similar_index = cosine_similarities.argmax()
    most_similar_score = cosine_similarities[0][most_similar_index]

    most_similar_chapter = df.iloc[most_similar_index]['chapter']
    
    return most_similar_chapter, most_similar_score

def MathsData(paragraph, TotalMathsMergedData, quetionsFile, formOfDocument):
    if formOfDocument == 0:
        df = pd.read_csv(TotalMathsMergedData)
        df['Tokens'] = df['Tokens'].astype(str)
        most_similar_chapter, similarity_score = check_paragraph_similarity(paragraph, df)

        if similarity_score > 0.5:
            print(f"The paragraph is similar to {most_similar_chapter} with a similarity score of {similarity_score:.2f}.")

            dframe = pd.read_csv(quetionsFile)

            print("Most similar chapter:", most_similar_chapter)
            print(dframe)
            chapter_allQuestions = dframe[dframe['chapter'] == most_similar_chapter]
            # print(chapter_allQuestions)
            quetion_Image = chapter_allQuestions['questionImage'].tolist()
            ans = chapter_allQuestions['ans'].tolist()

            

            # Convert the arrays to lists and return them
            result = {"quetion_Image": quetion_Image, "ans": ans}
            return result
        else:
            print("The paragraph is not similar to any chapter.")
            return "invalid Text"
    else:
        df = pd.read_csv(TotalMathsMergedData)
        df['Tokens'] = df['Tokens'].astype(str)
        # function call of image to text
        ExtractedText = ""  # Replace with actual extracted text
        most_similar_chapter, similarity_score = check_paragraph_similarity(ExtractedText, df)

        if similarity_score > 0.5:
            print(f"The paragraph is similar to Chapter {most_similar_chapter} with a similarity score of {similarity_score:.2f}.")
            dframe = pd.read_csv(quetionsFile)
            chapter_allQuestions = dframe[dframe['chapter'] == most_similar_chapter]
            quetion_Image = chapter_allQuestions['questionImage'].tolist()
            ans = chapter_allQuestions['ans'].tolist()

            # Convert the arrays to lists and return them
            result = {"quetion_Image": quetion_Image, "ans": ans}
            return result
        else:
            print("The paragraph is not similar to any chapter.")
            return "invalid Text"
