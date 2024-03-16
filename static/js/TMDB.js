const API_KEY = '8cc0165ba6cfe8f3f1d0704bba65c29c';
const BASE_URL = 'https://api.themoviedb.org/3';

const iterations = 20;
let movies = [];
let tvShows = [];
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

async function fetchMovieDetail(movieId) {
    const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US&append_to_response=credits,similar`;

    let data = await fetch(url);
    return data;
}

async function fetchStreamInfo(imdbId) {
    const url = `https://www.stream-app.tribestick.com/streams?id=${imdbId}&type=movie`;

    let data = await fetch(url);
    return data;
}

function renderMoviesAndTVShows(movies, tvShows) {
    let homeXml = templates.home(movies, tvShows);
    let homeDoc = Presenter.makeDocument(homeXml);

    homeDoc.addEventListener('select', async function (event) {
        // Enable if detail request takes too long
        // Presenter.showLoadingIndicator();

        let element = event.target;
        if (element.getAttribute('template') === 'movie') {
            let movieId = element.getAttribute('id');
            detail = await fetchMovieDetail(movieId);

            // let movie = movies.find(movie => movie.id == movieId);
            let movieDetailsXml = templates.detail(detail);
            let movieDetailsDoc = Presenter.makeDocument(movieDetailsXml);

            movieDetailsDoc.addEventListener('select', async function (event) {
                let element = event.target;
                if (element.getAttribute('template') === 'video') {
                    // let imdbId = element.getAttribute('id');
                    // let movie = movies.find(movie => movie.id == movieId);

                    let player = new Player();
                    player.present();

                    let streamInfo = await fetchStreamInfo(detail.imdb_id);
                    let mediaItem = new MediaItem("video", streamInfo.url);
                    let playlist = new Playlist();
                    playlist.push(mediaItem);

                    if (player) {
                        player.playlist = playlist;
                        player.play();
                        // player.addEventListener("stateDidChange", function (event) {
                        //     if (event.state === "end") {
                        //         // Presenter.removeLoadingIndicator();
                        //         // navigationDocument.popDocument();
                        //     }
                        // });
                    }

                }
            });
            Presenter.defaultPresenter(movieDetailsDoc)

        } else if (element.getAttribute('template') === 'tvShow') {
            // let tvShowId = element.getAttribute('tvShowId');
            // let tvShow = tvShows.find(tvShow => tvShow.id == tvShowId);
            // let tvShowDetailsXml = templates.detail();
            // let tvShowDetailsDoc = Presenter.makeDocument(tvShowDetailsXml);
            // navigationDocument.pushDocument(tvShowDetailsDoc);
        }


    },);

    Presenter.defaultPresenter(homeDoc)
}
