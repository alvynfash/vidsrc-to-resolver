import threading
import requests
import asyncio

from time import sleep
from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS

from vidsrc import SUPPORTED_SOURCES, VidSrcExtractor
from utils import NoSourcesFound
from yify_movies import YifyMoviesAPI
from yify_series import YifySeriesAPI
from real_debrid import RealDebrid

yifySeriesApi = YifySeriesAPI()
yifyMoviesApi = YifyMoviesAPI()
realDebridApi = RealDebrid()

app = Flask(__name__)
CORS(
    app,
    allow_origins=[
        "https://www.stream-app.tribestick.com/",
        "https://www.stream-app.tribestick.com",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:8000",
        "http://localhost:10000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  # Enable CORS for all domains on all routes
)
userAgent_header = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36'}

health_thread = None

def health_loop():
    while True:
        # Make a request to the health endpoint
        response = requests.get('https://stream-app.tribestick.com/health')
        
        # Check the response status code
        if response.status_code == 200:
            print('Server up and running')
        else:
            print('Server down or not reachable')
        
        # Wait for some time before making the next request
        sleep(60)

def start_health_check():
    global health_thread
    if not health_thread or not health_thread.is_alive():
        health_thread = threading.Thread(target=health_loop)
        health_thread.start()

# Start the health check upon Flask deployment
start_health_check()

@app.route('/streams', methods=['GET'])
def get_streams():
    media_id = request.args.get('id')
    media_type = request.args.get('type')
    season = request.args.get('season') if  request.args.get('season') else None
    episode = request.args.get('episode') if request.args.get('episode') else None
    get_subtitles = request.args.get('subtitles')

    if not media_id or not media_type:
        return jsonify({'error': 'Both id and type are required.'}), 400

    # Instantiate VidSrcExtractor
    vse = VidSrcExtractor(
        source_name = SUPPORTED_SOURCES[0],
        fetch_subtitles = True if get_subtitles else False,
    )
    streams, _, subtitles = vse.get_streams(media_type, media_id, season, episode)
    if not streams:
        # Instantiate VidSrcExtractor
        vse = VidSrcExtractor(
            source_name = SUPPORTED_SOURCES[1],
            fetch_subtitles = True if get_subtitles else False,
        )
        streams, _, subtitles = vse.get_streams(media_type, media_id, season, episode)
        if not streams:
            return jsonify({'error': 'No streams found for the provided parameters.'}), 404


    json_streams = {
        "url": streams[0],
        "subtitles": subtitles
    }

    return jsonify(json_streams), 200

# Health route
@app.route('/health', methods=['GET'])
def health_check():
    # Check if your application is healthy
    health_status = {'status': 'ok'}
    return jsonify(health_status), 200

@app.errorhandler(NoSourcesFound)
def handle_no_sources_found(error):
    return jsonify({'error': str(error)}), 404

@app.route('/details')
def detail():
    mediaUrl = request.args.get('mediaUrl')
    category = request.args.get('category')
    imdbId = request.args.get('imdbId')

    if category not in ['movie', 'series']:
        return jsonify({'error': 'category must be either movie or series.'}), 400

    if category == 'movie':
        if not imdbId:
            return jsonify({'error': 'imdbId is required.'}), 400

        return moviesDetails(imdbId=imdbId)

    if category == 'series':
        if not mediaUrl:
            return jsonify({'error': 'mediaUrl is required.'}), 400

        return seriesDetails(mediaUrl=mediaUrl)

def moviesDetails(imdbId):
    mediaDetails = yifyMoviesApi.getTorrents(imdbId=imdbId)
    return jsonify(mediaDetails)

def seriesDetails(mediaUrl):
    mediaDetails = yifySeriesApi.getSeries(mediaUrl=mediaUrl)
    return jsonify(mediaDetails)

@app.route('/search')
def search():
    query = request.args.get('query')

    if not query:
        return jsonify({'error': 'query is required.'}), 400
    
    searchResults = yifySeriesApi.search(query=query)
    return jsonify(searchResults)

@app.route('/movies')
def movies():
    page = request.args.get('page')

    if not page:
        return jsonify({'error': 'page is required.'}), 400
    
    moviesResults = yifySeriesApi.movies(page=page)
    return jsonify(moviesResults)

@app.route('/series')
def series():
    page = request.args.get('page')

    if not page:
        return jsonify({'error': 'page is required.'}), 400

    seriessResults = yifySeriesApi.series(page=page)
    return jsonify(seriessResults)

@app.route('/scrape')
def scrapeMovies():
    asyncio.run(YifyMoviesAPI().scrape2())
    return jsonify({'message': 'scrape complete'})

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=8080)