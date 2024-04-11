FROM python:3.12

# RUN mkdir sources
# ADD sources /sources
ADD utils.py .
ADD vidsrc.py .

# Copy requirements and install dependencies
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Copy other project files
COPY . .

# Expose the server port
EXPOSE 8080

# Set environment variable
ENV FLASK_APP=api.py

# Command to start the server
CMD flask run -h 0.0.0.0:8080
# CMD gunicorn api:app