const API_KEY = '8cc0165ba6cfe8f3f1d0704bba65c29c';
const BASE_URL = 'https://api.themoviedb.org/3';

const iterations = 10;
let movies = [];
let tvShows = [];
let detail = null;
let pageDoc = null;

var TMDB = {
    fetchMoviesAndTvShows: function () {
        Promise.all([fetchMovies(), fetchTVShows()])
            .then(() => renderMoviesAndTVShows(movies, tvShows))
            .catch(error => console.error('Error fetching movies and TV shows:', error));
    }
}

// function _buildMenu() {
//     let titles = ['Movies', 'TV Shows', 'Favorites', 'Search'];
//     let menuXml = templates.menu();
//     let menuDoc = Presenter.makeDocument(menuXml);
//     let menuBarXml = menuDoc.getElementsByTagName('menuBar').item(0);

//     titles.forEach(function (title) {
//         // Create title element and set its text content
//         let titleElement = menuDoc.createElement('title');
//         titleElement.textContent = title;

//         // Create menuItem element
//         let menuItemElement = menuDoc.createElement('menuItem');
//         menuItemElement.setAttribute('id', '$title');
//         // Append title element to menuItemElement
//         menuItemElement.appendChild(titleElement);

//         // Append menuItem to menuBar
//         menuBarXml.appendChild(menuItemElement);
//     });

//     pageDoc = menuDoc;
//     pageDoc.addEventListener('select', Presenter.load.bind(Presenter));
//     navigationDocument.pushDocument(pageDoc);
// }

// // Function to handle lazy loading of movies
// function lazyLoadMovies() {
//     if (currentMoviesPage < totalPages && isScrolledToBottom()) {
//         currentMoviesPage++;
//         fetchLatestMovies();
//     }
// }

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

    // homeDoc.addEventListener('select', Presenter.load.bind(Presenter));

    homeDoc.addEventListener('select', async function (event) {
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
                    Presenter.showLoadingIndicator();
                    // let imdbId = element.getAttribute('id');
                    // let movie = movies.find(movie => movie.id == movieId);
                    let streamInfo = await fetchStreamInfo(detail.imdb_id);

                    // let videoXml = templates.video(detail.title, streamInfo);
                    // let videoDoc = Presenter.makeDocument(videoXml);
                    // navigationDocument.pushDocument(videoDoc);

                    let mediaItem = new MediaItem("video", streamInfo.url);

                    var playlist = new Playlist();
                    playlist.push(mediaItem);

                    var player = new Player();
                    player.playlist = playlist;
                    player.addEventListener("stateDidChange", function (event) {
                        if (event.state === "end") {
                            Presenter.removeLoadingIndicator();
                        }
                    });

                    player.play();
                }
            });
            navigationDocument.pushDocument(movieDetailsDoc);
        } else if (element.getAttribute('template') === 'tvShow') {
            // let tvShowId = element.getAttribute('tvShowId');
            // let tvShow = tvShows.find(tvShow => tvShow.id == tvShowId);
            // let tvShowDetailsXml = templates.detail();
            // let tvShowDetailsDoc = Presenter.makeDocument(tvShowDetailsXml);
            // navigationDocument.pushDocument(tvShowDetailsDoc);
        }


    },);
    navigationDocument.pushDocument(homeDoc);
}
