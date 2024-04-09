FROM python:3.12

RUN mkdir sources
ADD sources /sources
ADD utils.py .
ADD vidsrc.py .

# Copy requirements and install dependencies
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Copy other project files
COPY . .

# Expose the server port
# EXPOSE 8080

# Command to start the server
CMD export FLASK_APP=api.py
CMD flask run
# CMD gunicorn api:app