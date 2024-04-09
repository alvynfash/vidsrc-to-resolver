FROM python:3.12

RUN mkdir sources
ADD sources /sources
ADD utils.py .
ADD vidsrc.py .
RUN pip install requests beautifulsoup4 questionary jsonify flask gunicorn

# Expose the server port
# EXPOSE 8080

# Command to start the server
CMD ["gunicorn", "-b", "0.0.0.0:8080", "api:app"]