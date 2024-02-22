from flask import Flask, request, jsonify

from vidsrc import VidSrcExtractor
from utils import NoSourcesFound

app = Flask(__name__)

# Instantiate VidSrcExtractor
vse = VidSrcExtractor(
    source_name = "Vidplay",
    fetch_subtitles = True,
)

@app.route('/streams', methods=['GET'])
def get_streams():
    media_id = request.args.get('id')
    media_type = request.args.get('type')
    season = request.args.get('season')
    episode = request.args.get('episode')

    if not media_id or not media_type:
        return jsonify({'error': 'Both id and type are required.'}), 400

    # Assuming vse is defined elsewhere
    streams, subtitles = vse.get_streams(media_type, media_id, None, None)
    if not streams:
        return jsonify({'error': 'No streams found for the provided parameters.'}), 404

    return jsonify(streams)

@app.errorhandler(NoSourcesFound)
def handle_no_sources_found(error):
    return jsonify({'error': str(error)}), 404

# if __name__ == '__main__':
#     app.run(debug=True)
