import requests
from bs4 import BeautifulSoup

class YifySeriesAPI():

    Base_url = "https://ytstv.me/"

    def __init__(self):
        self.headers = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36'}

    def getSeries(self, mediaUrl):
        self.headers['Referer'] = self.Base_url
        results = requests.get(mediaUrl, headers=self.headers)

        if not results.status_code == 200:
            if results.status_code == 403:
                print("\nThe URL responded with code 403.\nThis means that the server understood the request but refuses to authorize it.")
                results.close()
                exit()

            if results.status_code == 404:
                print("\nThe URL responded with code 404.\nThis means that the server cannot find the page you requested. ")
                results.close()
                exit()

            else:
                results.close()
                print("\nThe URL responded with code " + str(results.status_code) + ".\nThis means that the server is not responding to the request.")

        resultsSoup = BeautifulSoup(results.text, "html.parser")
        tvSeasonsElements = resultsSoup.find_all("div", {"class": "tvseason"})
        search_results = []

        for tvSeason in tvSeasonsElements:
            episode_results = []
            seasonTitle = tvSeason.find("strong").text
            episodes = tvSeason.find_all("a")
            for episode in episodes:
                episode_link_results = []
                episodeTitle = episode.text.replace("\n", "").strip()
                episodeUrl = episode.get("href").strip()

                results = requests.get(episodeUrl, headers=self.headers)
                if results.status_code == 200:
                    episodeSoup = BeautifulSoup(results.text, "html.parser")
                    episodeContainers = episodeSoup.find_all("div", {"id": "lnk list-downloads"})
                    for episodeContainer in episodeContainers:
                        episodeLinks = episodeContainer.find_all("a")
                        for episodeLink in episodeLinks:
                            episodeLinkTitleParts = episodeLink.find_all("span")[4].text.split('.')
                            # Assuming the format is consistent and the resolution is always the last part
                            resolution = episodeLinkTitleParts[-1] if episodeLinkTitleParts else ''
                            episode_link_url = episodeLink.attrs['href']

                            if episode_link_url.startswith("magnet:"):
                                episode_link_results.append({"url": episode_link_url, "resolution": resolution})
                    episode_results.append({"name": episodeTitle, "links": episode_link_results,})

            search_results.append({"name": seasonTitle, "episodes": episode_results})

        results.close()
        return search_results

    # def getMovies(self, mediaUrl):
    #     self.headers['Referer'] = self.Base_url
    #     results = requests.get(mediaUrl, headers=self.headers)

    #     if not results.status_code == 200:
    #         if results.status_code == 403:
    #             print("\nThe URL responded with code 403.\nThis means that the server understood the request but refuses to authorize it.")
    #             results.close()
    #             exit()

    #         if results.status_code == 404:
    #             print("\nThe URL responded with code 404.\nThis means that the server cannot find the page you requested. ")
    #             results.close()
    #             exit()

    #         else:
    #             results.close()
    #             print("\nThe URL responded with code " + str(results.status_code) + ".\nThis means that the server is not responding to the request.")

    #     resultsSoup = BeautifulSoup(results.text, "html.parser")
    #     linksContainer = resultsSoup.find_all("div", {"id": "list-dl"})
    #     linksSoup = BeautifulSoup(str(linksContainer), "html.parser")
    #     links = linksSoup.find_all("a")

    #     search_results = []
    #     for link in links:
    #         episodeLinkTitleParts = link.find_all("span")[4].text.split('.')
    #         # Assuming the format is consistent and the resolution is always the last part
    #         resolution = episodeLinkTitleParts[-1] if episodeLinkTitleParts else ''
    #         episode_link_url = link.attrs['href']

    #         if episode_link_url.startswith("magnet:"):
    #             search_results.append({"url": episode_link_url, "resolution": resolution})

    #     results.close()
    #     return search_results

    def search(self, query):
        self.headers['Referer'] = self.Base_url
        searchRequest = requests.get(f"{self.Base_url}?s={query}", headers=self.headers)

        if not searchRequest.status_code == 200:
            print(f"\nThe URL responded with code  {str(searchRequest.status_code)}.")
            searchRequest.close()
            exit()

        resultsSoup = BeautifulSoup(searchRequest.text, "html.parser")
        resultsContainer = resultsSoup.find_all("div", {"class": "movies-list movies-list-full"})
        search_results = []
        for resultContainer in resultsContainer:
            results = resultContainer.find_all("div", {"class": "ml-item"})
            for result in results:
                resultElement = result.find("a").attrs
                resultUrl = resultElement['href'].strip()
                resultTitle = resultElement['oldtitle'].strip()

                imageElement = result.find("img").attrs
                resultPosterUrl = imageElement['data-original'].replace("w185", "w500").strip()
                search_results.append({"title": resultTitle, "url": resultUrl, "poster_path": resultPosterUrl,})

        searchRequest.close()
        return search_results

    def movies(self, page):
        self.headers['Referer'] = self.Base_url
        moviesRequest = requests.get(f"{self.Base_url}movies/page/{page}", headers=self.headers)

        if not moviesRequest.status_code == 200:
            print(f"\nThe URL responded with code  {str(moviesRequest.status_code)}.")
            moviesRequest.close()
            exit()

        resultsSoup = BeautifulSoup(moviesRequest.text, "html.parser")
        resultsContainer = resultsSoup.find_all("div", {"class": "movies-list movies-list-full"})
        search_results = []
        for resultContainer in resultsContainer:
            results = resultContainer.find_all("div", {"class": "ml-item"})
            for result in results:
                resultElement = result.find("a").attrs
                resultUrl = resultElement['href'].strip()
                resultTitle = resultElement['oldtitle'].strip()

                imageElement = result.find("img").attrs
                resultPosterUrl = imageElement['data-original'].replace("w185", "w500").strip()
                search_results.append({"title": resultTitle, "url": resultUrl, "poster_path": resultPosterUrl,})

        moviesRequest.close()
        return search_results

    def series(self, page):
        self.headers['Referer'] = self.Base_url
        seriesRequest = requests.get(f"{self.Base_url}series/page/{page}", headers=self.headers)

        if not seriesRequest.status_code == 200:
            print(f"\nThe URL responded with code  {str(seriesRequest.status_code)}.")
            seriesRequest.close()
            exit()

        resultsSoup = BeautifulSoup(seriesRequest.text, "html.parser")
        resultsContainer = resultsSoup.find_all("div", {"class": "movies-list movies-list-full"})
        search_results = []
        for resultContainer in resultsContainer:
            results = resultContainer.find_all("div", {"class": "ml-item"})
            for result in results:
                resultElement = result.find("a").attrs
                resultUrl = resultElement['href'].strip()
                resultTitle = resultElement['oldtitle'].strip()

                imageElement = result.find("img").attrs
                resultPosterUrl = imageElement['data-original'].replace("w185", "w500").strip()
                search_results.append({"title": resultTitle, "url": resultUrl, "poster_path": resultPosterUrl,})

        seriesRequest.close()
        return search_results