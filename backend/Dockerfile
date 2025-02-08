# Use a lightweight Python image
FROM python:3.12.8-slim

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies (Tesseract OCR, build-essential, and other required tools)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libtesseract-dev \
    gcc \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Verify Tesseract installation
RUN tesseract --version

# Copy Python dependencies from the backend folder
COPY requirements.txt ./requirements.txt

# Upgrade pip, setuptools, wheel, and Cython
RUN pip install --upgrade pip setuptools wheel cython && \
    pip install --no-build-isolation -r req.txt
    
RUN python -m nltk.downloader punkt_tab

# Copy the backend code (including server.py and other files) into the container
COPY . /app

# Expose Flask's default port
EXPOSE 5000

# Set environment variables for Flask
ENV FLASK_APP=server
ENV FLASK_RUN_HOST=0.0.0.0

# Start the Flask server
CMD ["flask", "run"]
