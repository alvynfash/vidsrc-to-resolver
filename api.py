import threading
import requests

from time import sleep
from flask import Flask, request, jsonify

from vidsrc import SUPPORTED_SOURCES, VidSrcExtractor
from utils import NoSourcesFound

app = Flask(__name__)

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

# Health route
@app.route('/health', methods=['GET'])
def health_check():
    # Check if your application is healthy
    health_status = {'status': 'ok'}
    return jsonify(health_status), 200

@app.route('/streams', methods=['GET'])
def get_streams():
    media_id = request.args.get('id')
    media_type = request.args.get('type')
    season = request.args.get('season')
    episode = request.args.get('episode')
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

@app.errorhandler(NoSourcesFound)
def handle_no_sources_found(error):
    return jsonify({'error': str(error)}), 404

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=8080)