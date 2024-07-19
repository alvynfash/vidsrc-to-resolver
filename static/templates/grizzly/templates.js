// let tvBaseURL = "http://192.168.0.108:5500/";

const templates = {
  getPosterUrl: function (media) {
    return `https://image.tmdb.org/t/p/w500${media.poster_path}`;
  },

  getBackdropUrl: function (media) {
    return `https://image.tmdb.org/t/p/original${media.backdrop_path}`;
  },

  getDescription: function (media) {
    return `${media.overview}                                                                  `;
  },

  castLockup: function (credits) {
    let filteredCast = credits.cast.filter(member => member.profile_path !== null);

    let xml = `<shelf class="shelfLayout">
                  <header>
                    <title>Casts</title>
                  </header>
                  <section>`;

    filteredCast.forEach(castMember => {
      xml += `<monogramLockup>
                <monogram src="https://image.tmdb.org/t/p/w500${castMember.profile_path}" />
                <title>${castMember.name}</title>
              </monogramLockup>`;
    });

    xml += `</section>
          </shelf>`;

    return xml;
  },

  torrentLockup: function (torrents) {
    let filteredTorrents = torrents.filter(torrent => torrent.quality == "720p" || torrent.quality == "1080p");

    let xml = `<row>`;

    filteredTorrents.forEach(torrent => {
      xml += `<buttonLockup template="torrent" id="${torrent.hash}">
                <img src="${tvBaseURL}resources/images/icons/play.png" width="40" height="40" />
                <title>${torrent.quality}\n(${torrent.size})</title>
              </buttonLockup>`;
    });

    xml += `</row>`;

    return xml;
  },

  genresLockup: function (genres) {
    let xml = `<infoList>
                <info>
                  <header>
                    <title>Genre</title>
                  </header>`;

    genres.forEach(genre => {
      xml += `<text>${genre.name}</text>`;
    });

    xml += `</info>
          </infoList>`;

    return xml;
  },

  movieLockup: function (movie) {
    // <title>${movie.title}</title>
    return `<lockup template="movie" id="${movie.id}">
              <img src="${this.getPosterUrl(movie)}" width="245" height="340" />
            </lockup>`;
  },

  tvShowLockup: function (tvShow) {
    return `<lockup template="tvShow" id="${tvShow.id}">
            <img src="${this.getPosterUrl(tvShow)}" width="245" height="340" />
          </lockup>`;
  },

  moviesShelf: function (movies) {
    let xml = `<shelf>
                  <header>
                    <title>Movies</title>
                  </header>
                  <section>`;

    // Loop through each movie and generate lockup elements
    movies.forEach(movie => {
      xml += this.movieLockup(movie);
    });

    xml += `</section>
          </shelf>`;

    return xml;
  },

  najiaMoviesShelf: function (movies) {
    let xml = `<shelf>
                  <header>
                    <title>9Ja</title>
                  </header>
                  <section>`;

    // Loop through each movie and generate lockup elements
    movies.filter(movie => movie.poster_path != null).forEach(movie => {
      xml += this.movieLockup(movie);
    });

    xml += `</section>
          </shelf>`;

    return xml;
  },

  tvShowsshelf: function (tvShows) {
    let xml = `<shelf>
                  <header>
                    <title>Tv Shows</title>
                  </header>
                  <section>`;

    // Loop through each movie and generate lockup elements
    tvShows.forEach(tvShow => {
      xml += this.tvShowLockup(tvShow);
    });

    xml += `</section>
          </shelf>`;

    return xml;
  },

  home: function (movies, tvShows, naijaMovies) {
    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
  <document>
    <head>
      <style>
        .darkBackgroundColor {
          background-color: #091a2a;
        }
      </style>
    </head>

    <stackTemplate theme="dark" class="darkBackgroundColor">
      <identityBanner>
        <title>GrizzlyTime</title>
        <row>
          <buttonLockup template="search">
            <img src="${tvBaseURL}resources/images/icons/search.png" width="32" height="32" />
            <title>Search</title>
          </buttonLockup>
          <buttonLockup template="favorite">
            <img src="${tvBaseURL}resources/images/icons/star.png" width="32" height="32" />
            <title>Favorites</title>
          </buttonLockup>
        </row>
      </identityBanner>
      <collectionList>`;

    xml += this.moviesShelf(movies);

    // xml += this.tvShowsshelf(tvShows);

    // xml += this.najiaMoviesShelf(naijaMovies);

    xml += `</collectionList>
          </stackTemplate>
        </document>`;

    return xml;
  },

  movieDetail: function (media) {
    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
                <document>
                  <head>
                    <style>
                      .showTextOnHighlight {
                        tv-text-highlight-style: show-on-highlight;
                      }
                      .whiteBadge {
                        tv-tint-color: rgb(255, 255, 255);
                      }
                      .shelfLayout {
                        padding: 20 90 50;
                      }
                    </style>
                  </head>
                  <productTemplate theme="dark">
                    <background>
                    </background>
                    <banner>`;

    xml += this.genresLockup(media.genres);

    xml += `<stack>
              <title>${media.title}</title>
              <row>
                <text><badge src="resource://tomato-fresh" /> ${parseFloat(media.vote_average).toFixed(1)}</text>
                <text>${media.release_date}</text>
                <badge src="resource://mpaa-pg" class="whiteBadge" />
                <badge src="resource://cc" class="whiteBadge" />
              </row>
              <description template="alert" handlesOverflow="true" allowsZooming="true">${this.getDescription(media)}</description>`;

    xml += this.torrentLockup(media.torrents);

    xml += `</stack>`;

    xml += `<heroImg src="${this.getBackdropUrl(media)}" />
          </banner>`;

    xml += this.castLockup(media.credits);

    xml += `</productTemplate>
          </document>`;

    return xml;
  },

  tvDetail: function (media, seasons) {
    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
                <document>
                  <head>
                    <style>
                      .showTextOnHighlight {
                        tv-text-highlight-style: show-on-highlight;
                      }
                      .whiteBadge {
                        tv-tint-color: rgb(255, 255, 255);
                      }
                      .shelfLayout {
                        padding: 20 90 50;
                      }
                    </style>
                  </head>
                  <productTemplate theme="dark">
                    <background>
                    </background>
                    <banner>`;

    // xml += this.genresLockup(media.genres);

    xml += `<stack>
              <title>${media.name}</title>
              <row>
                <text><badge src="resource://tomato-fresh" /> ${parseFloat(media.vote_average).toFixed(1)}</text>
                <text>${media.first_air_date}</text>
                <badge src="resource://mpaa-pg" class="whiteBadge" />
                <badge src="resource://cc" class="whiteBadge" />
              </row>
              <description template="alert" handlesOverflow="true" allowsZooming="true">${this.getDescription(media)}</description>
              <row>
                <buttonLockup>
                  <img src="${tvBaseURL}resources/images/icons/star_plus.png" width="40" height="40" />
                  <title>Add to List</title>
                </buttonLockup>
              </row>
            </stack>`;

    xml += `<heroImg src="${this.getBackdropUrl(media)}" />
          </banner>`;

    seasons.forEach(season => {
      xml += this.seasonLockup(season);
    });

    xml += this.castLockup(media.credits);

    xml += `</productTemplate>
          </document>`;

    return xml;
  },

  search: function () {
    return `<?xml version="1.0" encoding="UTF-8" ?>
                    <document>
                      <head>
                        <style>
                          .suggestionListLayout {
                            margin: -150 0;
                          }
                        </style>
                      </head>
                      <searchTemplate>
                        <searchField id="searchField">Search</searchField>
                        <collectionList>
                          <grid>
                            <header>
                              <title>Type the name of a movie or Tv Show to find it</title>
                            </header>
                            <section>
                            </section>
                          </grid>
                        </collectionList>
                      </searchTemplate>
                    </document>`;
  },

  noSearchResultLockup: function (title, message) {
    return `<list>
              <section>
                <header>
                  <title>${title}</title>
                  <text>${message}</text>
                </header>
              </section>
            </list>`;
  },

  searchResultsCollection: function (results) {
    let xml = `<collectionList>
                <grid>
                  <header>
                    <title>Results</title>
                  </header>
                  <section>`;

    results.forEach(result => {
      if (result.media_type === 'tv') {
        xml += this.tvShowLockup(result);
        return;
      }
      xml += this.movieLockup(result);
    });

    xml += `</section>
          </grid>
        </collectionList>`;

    return xml;
  },

  seasonLockup: function (season) {
    let xml = `<shelf class="shelfLayout">
                  <header>
                    <title>${season.name}</title>
                  </header>
               <section>`;

    season.episodes.filter(episode => episode.air_date <= new Date().toISOString() && episode.still_path !== null).forEach(episode => {
      xml += this.episodeLockup(episode, episode.episode_number, season.season_number);
    });

    xml += `</section>
          </shelf>`;

    return xml;
  },

  episodeLockup: function (episode, episodeNumber, seasonNumber) {
    return `<lockup template="episode" id="${episode.show_id}" episode="${episodeNumber}" season="${seasonNumber}">
            <img src="https://image.tmdb.org/t/p/original${episode.still_path}" width="340" height="245" />
            <title>Episode ${episode.episode_number}</title>
          </lockup>`;
  },
};