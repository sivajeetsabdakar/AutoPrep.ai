from flask import Flask, request, jsonify
from chemNEETData import chem_NEET_data
from phyNEETData import phy_NEET_data
from bioNEET import bio_data
from phyData import phy_data
from chemData import chem_data
from methsData import MathsData
from flask_cors import CORS
from highLight import highLight
from basetoimage import main
import base64 
import pandas as pd

app = Flask(__name__)
app.config['debug'] = True
CORS(app=app)
@app.route('/get-example', methods=['GET'])
def get_example():
    data = {
        'message': 'This is a GET request',
        'status': 'success'
    }
    return jsonify(data)
  
import random
import os

def get_random_questions(exam_type):
    """Fetch random questions from the respective CSV files based on the exam type."""
    question_files = []
    try:
        # Ensure we get the actual script's directory, not the __pycache__ directory
        base_dir = os.path.dirname(os.path.realpath(__file__))

        # Navigate one level up to the main HacktheMountain directory
        hackthemountain_dir = os.path.abspath(os.path.join(base_dir))

        # Construct the path to the csvFiles folder
        csv_dir = os.path.join(hackthemountain_dir, 'csvFiles')

        if exam_type == 'jee':
            # Load the CSV files for JEE
            chem_df = pd.read_csv(os.path.join(csv_dir, 'Jee_chem.csv'))
            phy_df = pd.read_csv(os.path.join(csv_dir, 'Jee_physics.csv'))
            math_df = pd.read_csv(os.path.join(csv_dir, 'Final_Maths_Jee.csv'))
            question_files = [chem_df, phy_df, math_df]
        elif exam_type == 'neet':
            # Load the CSV files for NEET
            bio_df = pd.read_csv(os.path.join(csv_dir, 'Neet_BIo.csv'))
            phy_df1 = pd.read_csv(os.path.join(csv_dir, 'Neet_phy.csv'))
            chem_df1 = pd.read_csv(os.path.join(csv_dir, 'Neet_chem.csv'))
            question_files = [bio_df, phy_df1, chem_df1]
        else:
            return None, None

        # Process as before
        questions = []
        solutions = []
        for df in question_files:
            if df.empty:
                print("One of the DataFrames is empty.")
                continue

            try:
                selected_row = df.sample(1).iloc[0]
                if exam_type == 'jee' and df.equals(math_df):
                    question_base64 = selected_row['questionImage']
                else:
                    question_base64 = selected_row['image']
                solution_base64 = selected_row['ans']
                questions.append(str(question_base64))
                solutions.append(str(solution_base64))
            except Exception as e:
                print(f"Error processing DataFrame: {e}")

        if not questions:
            print("No questions were retrieved.")
            return None, None

        return questions, solutions
    except Exception as e:
        print(f"Error fetching questions: {e}")
        return None, None


@app.route('/get-questions', methods=['GET'])
def get_questions():
    try:
        # Get the exam type from the request parameters (either 'jee' or 'neet')
        exam_type = request.args.get('examType', '').lower()

        if exam_type not in ['jee', 'neet']:
            return jsonify({"error": "Invalid exam type. Please specify either 'jee' or 'neet'."}), 400

        # Get random questions and solutions
        questions, solutions = get_random_questions(exam_type)

        if questions is None or solutions is None:
            return jsonify({"error": "Could not retrieve questions."}), 500

        # Return the list of base64 questions and solutions as a JSON response
        return jsonify({"questions": questions, "solutions": solutions, "status": "success"}), 200

    except Exception as e:
        print(f"Error in /get-questions route: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

base_dir = os.path.dirname(os.path.realpath(__file__))
rootdir = os.path.abspath(os.path.join(base_dir))

@app.route('/Jee_Maths', methods=['POST'])
def methsData():
    try:
        
        data = request.get_json()
        paragraph = data.get('paragraph', '')
        formOfDocument = int(data.get('formOfDocument', 0))
        csv_file_path = os.path.join(rootdir, 'csvFiles', 'Final_Maths_Jee.csv')
        quetionsFile = csv_file_path
        csv_file_path2 = os.path.join(rootdir, 'csvFiles', 'TotalMathsMergedData.csv')
        TotalMathsMergedData = csv_file_path2

        result = MathsData(paragraph=paragraph, TotalMathsMergedData=TotalMathsMergedData, quetionsFile=quetionsFile, formOfDocument=formOfDocument)

        return jsonify({"message": "Data processed successfully!", "result": result}), 200

    except Exception as e:

        print("Error in processing:", e)
        return jsonify({"error": "Failed to process data"}), 500
    
@app.route('/Jee_Chemistry',methods=['POST'])
def chemData():
    csv_file_path = os.path.join(rootdir, 'csvFiles', 'Jc.csv')
    file = csv_file_path    
    posted_data = request.get_json()

    paragraph = posted_data['text']
    
    
    return chem_data(file , paragraph)

@app.route('/Jee_Physics',methods=['POST'])
def phyData():
    csv_file_path = os.path.join(rootdir, 'csvFiles', 'Jee_physics.csv')
    file = csv_file_path
    posted_data = request.get_json()

    paragraph = posted_data['text']
    
    return phy_data(file,paragraph)

@app.route('/NEET_bio',methods=['POST'])
def bioData():


    csv_file_path = os.path.join(rootdir, 'csvFiles', 'Nb.csv')
    file = csv_file_path
    
    posted_data = request.get_json()

    paragraph = posted_data['text']
    
    
    return bio_data(file,paragraph)

@app.route('/NEET_chem',methods=['POST'])
def chemNEETData():


    
    csv_file_path = os.path.join(rootdir, 'csvFiles', 'Nc.csv')
    file = csv_file_path    
    
    posted_data = request.get_json()

    paragraph = posted_data['text']
    
    
    return chem_NEET_data(file,paragraph)

@app.route('/NEET_phy',methods=['POST'])
def phyNEETData():

   
    csv_file_path = os.path.join(rootdir, 'csvFiles', 'Np.csv')
    file = csv_file_path    
    posted_data = request.get_json()

    paragraph = posted_data['text']
        
    
    
    return phy_NEET_data(file,paragraph)

@app.route('/GetHighLight', methods=['POST'])
def HighLight():
    if 'file' not in request.files or 'pageNumber' not in request.form:
        return jsonify({'error': 'File or page number missing'}), 400

    file = request.files['file']
    page_number = int(request.form['pageNumber'])
    return highLight(file=file , page_number=page_number)

@app.route('/Text_extract', methods=['POST'])
def extracted_text():
    file = request.get_json()
    subject = file.get("Subject")
    base_string = file.get('ImageBase64String')
    # print(base_string)
    # Add padding to the Base64 string if needed
    base_string += '=' * (-len(base_string) % 4)
    # print(base_string)
    try:
        
        result = main(base_string)
        if not isinstance(result, str):
            result = str(result)
        # print(type(result))
        if subject=="Jc":
            filePath = os.path.join(rootdir, 'csvFiles', 'Jc.csv')
            return chem_data(filePath,result)
        elif subject=="Jp":
            filePath = os.path.join(rootdir, 'csvFiles', 'Jp.csv')
            return phy_data(filePath,result)
        elif subject=="Nb":
            filePath = os.path.join(rootdir, 'csvFiles', 'Nb.csv')
            return bio_data(filePath,result)
        elif subject=="Nc":
            filePath = os.path.join(rootdir, 'csvFiles', 'Nc.csv')
            return chem_NEET_data(filePath,result)
        elif subject=="Np":
            filePath = os.path.join(rootdir, 'csvFiles', 'Np.csv')
            return phy_NEET_data(filePath,result)
        elif subject=="Jm":
            filePath = os.path.join(rootdir, 'csvFiles', 'Jm.csv')
            TotalMathsMergedData = os.path.join(rootdir, 'csvFiles', 'TotalMathsMergedData.csv')
            return MathsData(quetionsFile=filePath,paragraph=result , TotalMathsMergedData=TotalMathsMergedData, formOfDocument='1sd')
        else:
            return jsonify({"Sorry yarr kuch nhi h!!"}, 404) 
       
    
    except Exception as e:
        # Log and return any errors that occur
        print("Error in text extraction:", e)
        return jsonify({"error": "Failed to extract text"}), 500
if __name__ == '__main__':
    app.run(debug=True)
