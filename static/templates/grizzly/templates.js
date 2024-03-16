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

  movieLockup: function (movies) {
    let xml = `<shelf>
                  <header>
                    <title>Movies</title>
                  </header>
                  <section>`;

    // Loop through each movie and generate lockup elements
    movies.forEach(movie => {
      xml += `<lockup template="movie" id="${movie.id}">
                <img src="${this.getPosterUrl(movie)}" width="245" height="340" />
              </lockup>`;
    });

    xml += `</section>
          </shelf>`;

    return xml;
  },

  tvShowLockup: function (tvShows) {
    let xml = `<shelf>
                  <header>
                    <title>Tv Shows</title>
                  </header>
                  <section>`;

    // Loop through each movie and generate lockup elements
    tvShows.forEach(tvShow => {
      xml += `<lockup template="tvShow">
                <img src="${this.getPosterUrl(tvShow)}" width="245" height="340" />
              </lockup>`;
    });

    xml += `</section>
          </shelf>`;

    return xml;
  },

  home: function (movies, tvShows) {
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
          <buttonLockup>
            <img src="${tvBaseURL}resources/images/icons/star.png" width="32" height="32" />
            <title>Favorites</title>
          </buttonLockup>
          <buttonLockup>
            <img src="${tvBaseURL}resources/images/icons/search.png" width="32" height="32" />
            <title>Search</title>
          </buttonLockup>
        </row>
      </identityBanner>
      <collectionList>`;

    xml += this.movieLockup(movies);

    xml += this.tvShowLockup(tvShows);

    xml += `</collectionList>
          </stackTemplate>
        </document>`;

    return xml;
  },

  detail: function (media) {
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
                <text><badge src="resource://tomato-fresh" /> ${media.vote_average}</text>
                <text>${media.release_date}</text>
                <badge src="resource://mpaa-pg" class="whiteBadge" />
                <badge src="resource://cc" class="whiteBadge" />
              </row>
              <description handlesOverflow="true" allowsZooming="true">${this.getDescription(media)}</description>
              <row>
                <buttonLockup template="video" id="${media.id}">
                  <img src="${tvBaseURL}resources/images/icons/play.png" width="40" height="40" />
                  <title>Watch</title>
                </buttonLockup>
                <buttonLockup>
                  <img src="${tvBaseURL}resources/images/icons/star_plus.png" width="40" height="40" />
                  <title>Add to List</title>
                </buttonLockup>
              </row>
            </stack>`;

    xml += `<heroImg src="${this.getBackdropUrl(media)}" />
          </banner>`;

    xml += this.castLockup(media.credits);

    xml += `</productTemplate>
          </document >`;

    return xml;
  },

  test: function () {
    return `<?xml version="1.0" encoding="UTF-8" ?>
            <document>
              <alertTemplate>
                <title>Error</title>
                <description>Something went wrong</description>
              </alertTemplate>
            </document>`;
  }
};