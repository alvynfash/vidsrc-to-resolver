const API_KEY = '8cc0165ba6cfe8f3f1d0704bba65c29c';
const BASE_URL = 'https://api.themoviedb.org/3';
const VidSrc_Stream_URl = 'https://stream-app.tribestick.com/streams';
const YTS_BASE_URL = 'https://yts.mx/api/v2';
const RapidApiKey = '7a78ae4eeamshc12e49d24da11e3p12f8e1jsn9f095d094e00';

const iterations = 20;
let movies = [];
let tvShows = [];
let naijaMovies = [];
let seasons = [];
let detail = null;
let pageDoc = null;

var TMDB = {
    fetchMoviesAndTvShows: function () {
        Presenter.showLoadingIndicator();
        Promise.all([
            fetchMovies(),
            // fetchTVShows(),
            // fetch9jaMovies(),
        ])
            .then(() => renderMoviesAndTVShows(movies, tvShows, naijaMovies))
            .catch(error => console.error('Error fetching movies and TV shows:', error));
    }
}

function fetch(url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error('Request failed: ' + xhr.status));
                }
            }
        };
        xhr.open('GET', url);
        xhr.send();
    });
}

function storeTorrentHash(hash) {
    return new Promise(function (resolve, reject) {
        const data = `magnet:?xt=urn:btih:${hash}`;

        const xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error('Request failed: ' + xhr.status));
                }
            }
        };

        xhr.open('POST', `https://webtor.p.rapidapi.com/resource`);
        xhr.setRequestHeader('x-rapidapi-key', RapidApiKey);
        xhr.setRequestHeader('x-rapidapi-host', 'webtor.p.rapidapi.com');
        xhr.setRequestHeader('Content-Type', 'text/plain');

        xhr.send(data);
    });
}

function fetchTorrentFiles(resourceId) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error('Request failed: ' + xhr.status));
                }
            }
        };
        xhr.open('GET', `https://webtor.p.rapidapi.com/resource/${resourceId}/list?path=%2F&limit=10&offset=0&output=list`);
        xhr.setRequestHeader('x-rapidapi-key', RapidApiKey);
        xhr.setRequestHeader('x-rapidapi-host', 'webtor.p.rapidapi.com');
        xhr.send();
    });
}

function fetchVideoStreamInfo(resourceId, contentId) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error('Request failed: ' + xhr.status));
                }
            }
        };
        xhr.open('GET', `https://webtor.p.rapidapi.com/resource/${resourceId}/export/${contentId}`);
        xhr.setRequestHeader('x-rapidapi-key', RapidApiKey);
        xhr.setRequestHeader('x-rapidapi-host', 'webtor.p.rapidapi.com');
        xhr.send();
    });
}

async function fetchMovies() {
    for (let i = 0; i < iterations; i++) {
        const url = `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&page=${i + 1}&language=en-US`;
        let data = await fetch(url);
        movies = [...movies, ...data.results];
    }
}

async function fetchTVShows() {
    for (let i = 0; i < iterations; i++) {
        const url = `${BASE_URL}/trending/tv/day?api_key=${API_KEY}&page=${i + 1}&language=en-US`;

        let data = await fetch(url);
        tvShows = [...tvShows, ...data.results];
    }
}

async function fetch9jaMovies() {
    for (let i = 0; i < iterations; i++) {
        const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&include_adult=false&include_video=false&language=en-US&page=${i + 1}&sort_by=popularity.desc&with_origin_country=NG`;
        let data = await fetch(url);
        naijaMovies = [...naijaMovies, ...data.results];

        if (i == data.total_pages) {
            break;
        }
    }
}

async function fetchStreamInfo(imdbId) {
    const url = `${VidSrc_Stream_URl}?id=${imdbId}&type=movie`;

    let data = await fetch(url);
    return data;
}

async function fetchEpisodeStreamInfo(id, season, episode) {
    const url = `${VidSrc_Stream_URl}?id=${id}&type=tv&season=${season}&episode=${episode}`;

    let data = await fetch(url);
    return data;
}

function renderMoviesAndTVShows(movies, tvShows, naijaMovies) {
    let homeXml = templates.home(movies, tvShows, naijaMovies);
    let homeDoc = Presenter.makeDocument(homeXml);
    attachMainListener(homeDoc);
    Presenter.defaultPresenter(homeDoc)
}

function attachMainListener(document) {
    document.addEventListener('select', async function (event) {
        // Enable if detail request takes too long
        // Presenter.showLoadingIndicator();

        let element = event.target;
        let template = element.getAttribute('template');

        if (template === 'search') {
            let searchXml = templates.search();
            let searchDoc = Presenter.makeDocument(searchXml);
            attachMainListener(searchDoc);
            Presenter.searchPresenter(searchDoc, (searchQuery) => {
                this.buildResults(searchDoc, searchQuery);
            });
            return;
        }

        if (template === 'favorite') {
            return;
        }

        if (template === 'movie') {
            let movieId = element.getAttribute('id');
            // Fetch torrent from YTS
            let torrents = await fetchMovieTorrents(movieId);
            let filteredTorrents = torrents.filter(torrent => torrent.seeds > 0);
            // Fetch movie details from TMDB
            theMovieDb.movies.getById({
                "id": movieId,
                "append_to_response": "credits,similar",
            }, function async(data) {
                let detail = JSON.parse(data);
                detail.torrents = filteredTorrents;
                let movieDetailsXml = templates.movieDetail(detail);
                let movieDetailsDoc = Presenter.makeDocument(movieDetailsXml);

                attachDetailListener(movieDetailsDoc, detail);
                Presenter.defaultPresenter(movieDetailsDoc)
            }, errorCallback);

            return;
        }

        if (template === 'tvShow') {
            let showId = element.getAttribute('id');
            theMovieDb.tv.getById({
                "id": showId,
                "append_to_response": "credits,similar",
            }, function (data) {
                let detail = JSON.parse(data);
                seasons = [];
                for (let i = 1; i <= detail.number_of_seasons; i++) {
                    theMovieDb.tvSeasons.getById({ "id": showId, "season_number": i }, function (data) {
                        let result = JSON.parse(data);
                        seasons.push(result);

                        if (seasons.length === detail.number_of_seasons) {
                            let tvDetailsXml = templates.tvDetail(detail, seasons.sort((a, b) => b.season_number - a.season_number));
                            let tvDetailsDoc = Presenter.makeDocument(tvDetailsXml);

                            attachDetailListener(tvDetailsDoc, detail);
                            Presenter.defaultPresenter(tvDetailsDoc)
                        }
                    }, errorCallback);
                }
            }, errorCallback);
            return;
        }
    },);
}

function attachDetailListener(document, detail) {
    document.addEventListener('select', async function (event) {
        let element = event.target;
        let template = element.getAttribute('template');

        if (template === 'alert') {
            let alertDoc = createAlert(detail.title ?? detail.name, detail.overview);
            Presenter.modalDialogPresenter(alertDoc);
            return;
        }

        if (template === 'video') {
            let id = element.getAttribute('id');

            let player = new Player();
            player.present();

            let streamInfo = await fetchStreamInfo(detail.imdb_id);
            let mediaItem = new MediaItem("video", streamInfo.url);
            let playlist = new Playlist();
            playlist.push(mediaItem);

            if (player) {
                player.playlist = playlist;
                player.play();
            }
            return;
        }

        if (template === 'episode') {
            let id = element.getAttribute('id');
            let seasonNumber = element.getAttribute('season');
            let episodeNumber = element.getAttribute('episode');

            let player = new Player();
            player.present();

            let streamInfo = await fetchEpisodeStreamInfo(id, seasonNumber, episodeNumber);
            let mediaItem = new MediaItem("video", streamInfo.url);
            let playlist = new Playlist();
            playlist.push(mediaItem);

            if (player) {
                player.playlist = playlist;
                player.play();
            }
            return;
        }

        if (template === 'torrent') {
            let player = new Player();
            try {
                let hash = element.getAttribute('id');

                player.present();

                // Store torrent hash
                response = await storeTorrentHash(hash);
                let resourceId = response.id;

                // Fetch torrent files
                response = await fetchTorrentFiles(resourceId);
                let videoFile = filterVideoFile(response.items);
                let contentId = videoFile[0].id;

                // Fetch video stream info
                response = await fetchVideoStreamInfo(resourceId, contentId);
                let streamUrl = response.exports.stream.url;

                // Play video
                let mediaItem = new MediaItem("video", streamUrl);
                let playlist = new Playlist();
                playlist.push(mediaItem);

                if (player) {
                    player.playlist = playlist;
                    player.play();
                }
            } catch (error) {
                console.error('Error fetching torrent:', error);
                navigationDocument.popDocument();
                player = null;
            }

            return;
        }
    });
}

function buildResults(doc, searchText) {

    //Create parser and new input element
    var domImplementation = doc.implementation;
    var lsParser = domImplementation.createLSParser(1, null);
    var lsInput = domImplementation.createLSInput();

    if (searchText.length < 3) {
        lsInput.stringData = templates.noSearchResultLockup('', 'Needs at least 3 characters');
        lsParser.parseWithContext(lsInput, doc.getElementsByTagName("collectionList").item(0), 2);
        return;
    }

    theMovieDb.search.getMulti(
        { "query": searchText },
        function successCallBack(data) {
            let json = JSON.parse(data);
            let results = json.results;
            let filteredResults = results.filter(result => result.poster_path && result.poster_path.length > 0);

            if (filteredResults.length == 0) {
                lsInput.stringData = templates.noSearchResultLockup('No Results', '');
                lsParser.parseWithContext(lsInput, doc.getElementsByTagName("collectionList").item(0), 2);
                return;
            }

            lsInput.stringData = templates.searchResultsCollection(filteredResults);
            lsParser.parseWithContext(lsInput, doc.getElementsByTagName("collectionList").item(0), 2);
        },
        function errorCallback(data) {
            let error = data;
            console.error('Error searching TMDB:', error);
            lsInput.stringData = templates.noSearchResultLockup('', '... Error Performing Search ...');
            lsParser.parseWithContext(lsInput, doc.getElementsByTagName("collectionList").item(0), 2);
        },
    );

}

function errorCallback(data) {
    console.log("Error callback: " + data);
};

async function fetchMovieTorrents(movieId) {
    let imdbId = await fetchImdbId(movieId);

    const url = `${YTS_BASE_URL}/movie_details.json?with_cast=true&imdb_id=${imdbId}`;
    let result = await fetch(url);
    return result.data.movie.torrents || [];
}

async function fetchImdbId(movieId) {
    const url = `${BASE_URL}/movie/${movieId}/external_ids?api_key=${API_KEY}`;

    let result = await fetch(url);
    return result.imdb_id;
}

function filterVideoFile(files) {
    return files.filter(file => file.media_format === 'video');
}