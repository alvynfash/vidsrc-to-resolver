// let tvBaseURL = "http://192.168.0.108:5500/";

const templates = {
  getPosterUrl: function (media) {
    return `https://image.tmdb.org/t/p/w500${media.poster_path}`;
  },

  getBackdropUrl: function (media) {
    return `https://image.tmdb.org/t/p/original${media.backdrop_path}`;
  },

  getGenres: function (media) {
    return media.genres.map(genre => genre.name);
  },

  getDescription: function (media) {
    return `${media.overview}                                                                  `;
  },

  creditLockup: function (castMember) {
    return `<monogramLockup>
              <monogram src="https://image.tmdb.org/t/p/w500${castMember.profile_path}" />
              <title>${castMember.name}</title>
            </monogramLockup>`;
  },

  movieLockup: function (movie) {
    // <title>${movie.title}</title>
    return `
      <lockup template="movie" id="${movie.id}">
        <img src="${this.getPosterUrl(movie)}" width="245" height="340" />
      </lockup>`;
  },

  tvShowLockup: function (tvShow) {
    // let title = tvShow.name;
    // <title>${title}</title>
    return `
      <lockup template="tvShow">
        <img src="${this.getPosterUrl(tvShow)}" width="245" height="340" />
      </lockup>`;
  },

  home: function (movies, tvShows) {
    // Return the XML string for the movies template
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
              <badge src="resource://button-checkmark" />
              <title>Favorites</title>
            </buttonLockup>
            <buttonLockup>
              <badge src="resource://button-checkmark" />
              <title>Search</title>
            </buttonLockup>
          </row>
        </identityBanner>
        <collectionList>
          <shelf>
            <header>
              <title>Movies</title>
            </header>
            <section>`;

    // Loop through each movie and generate lockup elements
    movies.forEach(movie => {
      xml += this.movieLockup(movie);
    });

    // Close the section and grid tags
    xml += `
    </section>
          </shelf>
          <shelf>
            <header>
              <title>Tv Shows</title>
            </header>
            <section>`;

    // Loop through each movie and generate lockup elements
    tvShows.forEach(tvShow => {
      xml += this.tvShowLockup(tvShow);
    });

    // Close the section and grid tags
    xml += `
            </section>
          </shelf>
        </collectionList>
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
          <img src="${this.getBackdropUrl(media)}" />
        </background>
        <banner>
          <stack>
            <title>${media.title}</title>
            <text>IMDB (${media.vote_average})</text>
            <text>${this.getGenres(media)}</text>
            <description allowsZooming="true" template="${tvBaseURL}templates/AlertWithDescription.xml.js" presentation="modalDialogPresenter">${this.getDescription(media)}</description>
            <row>
              <buttonLockup template="video" id="${media.id}">
                <badge src="resource://button-cloud" class="whiteBadge" />
                <title>Watch</title>
              </buttonLockup>
              <buttonLockup>
                <badge src="resource://button-add" class="whiteBadge" />
                <title>Favorites</title>
              </buttonLockup>
            </row>
          </stack>
        </banner>
        <shelf class="shelfLayout">
          <header>
            <title>Casts</title>
          </header>
          <section>`;

    const filteredCast = media.credits.cast.filter(member => member.profile_path !== null);
    filteredCast.forEach(castMember => {
      xml += this.creditLockup(castMember);
    });

    xml += `</section>
      </shelf>
      </productTemplate>
    </document>`;

    return xml;
  },

  video: function (title, streamInfo) {
    return `<?xml version="1.0" encoding="UTF-8" ?>
    <document>
      <fullScreenTemplate>
        <banner>
            <title>Title of the Media</title>
            <subtitle>Subtitle of the Media</subtitle>
        </banner>
        <content>
            <video autoplay="true" id="myVideo">
                <title>${title}</title>
                <source src="${streamInfo.url}" />
            </video>
        </content>
      </fullScreenTemplate>
    </document>`;
  }
};