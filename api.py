from flask import Flask, request, jsonify

from vidsrc import SUPPORTED_SOURCES, VidSrcExtractor
from utils import NoSourcesFound

app = Flask(__name__)

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
