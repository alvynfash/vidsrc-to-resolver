FROM python:3.12

RUN mkdir sources
ADD sources /sources
ADD utils.py .
ADD vidsrc.py .
RUN pip install requests beautifulsoup4 questionary

CMD python vidsrc.py