const API_KEY = '8cc0165ba6cfe8f3f1d0704bba65c29c';
const BASE_URL = 'https://api.themoviedb.org/3';
const VidSrc_Stream_URl = 'https://stream-app.tribestick.com/streams';

const iterations = 20;
let movies = [];
let tvShows = [];
let seasons = [];
let detail = null;
let pageDoc = null;

var TMDB = {
    fetchMoviesAndTvShows: function () {
        Presenter.showLoadingIndicator();
        Promise.all([fetchMovies(), fetchTVShows()])
            .then(() => renderMoviesAndTVShows(movies, tvShows))
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

async function fetchSearchResults(query) {
    theMovieDb.search.getMulti({ "query": query }, function successCallBack(data) {
        // console.log("Error callback: " + data);
        return JSON.parse(data);
    }, function errorCallback(data) {
        console.error('Error fetching data from TMDB API:', data);
        return [];
    });

    // const tmdbEndpoint = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`;

    // try {
    //     const response = await fetch(tmdbEndpoint);
    //     return response.results;
    // } catch (error) {
    //     console.error('Error fetching data from TMDB API:', error);
    //     return [];
    // }
}

function renderMoviesAndTVShows(movies, tvShows) {
    let homeXml = templates.home(movies, tvShows);
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
            theMovieDb.movies.getById({
                "id": movieId,
                "append_to_response": "credits,similar",
            }, function (data) {
                let detail = JSON.parse(data);
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
                            // seasons.sort((a, b) => a.season_number - b.season_number);
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
    // this.fetchSearchResults(searchText)
    //     .then(results => {
    //         let filteredResults = results.filter(result => result.poster_path && result.poster_path.length > 0);

    //         if (filteredResults.length == 0) {
    //             lsInput.stringData = templates.noSearchResultLockup('No Results', '');
    //             lsParser.parseWithContext(lsInput, doc.getElementsByTagName("collectionList").item(0), 2);
    //             return;
    //         }

    //         lsInput.stringData = templates.searchResultsCollection(filteredResults);
    //         lsParser.parseWithContext(lsInput, doc.getElementsByTagName("collectionList").item(0), 2);
    //     })
    //     .catch(error => {
    //         console.error('Error searching TMDB:', error);
    //         lsInput.stringData = templates.noSearchResultLockup('', '... Error Performing Search ...');
    //         lsParser.parseWithContext(lsInput, doc.getElementsByTagName("collectionList").item(0), 2);
    //     });
}

function errorCallback(data) {
    console.log("Error callback: " + data);
};