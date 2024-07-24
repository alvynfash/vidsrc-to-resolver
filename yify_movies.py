import asyncio
import requests
import re
import unidecode
from bs4 import BeautifulSoup
from urllib.parse import urlparse

from real_debrid import RealDebrid

class YifyMoviesAPI():

    Base_url = "https://yts.mx/api/v2"

    def __init__(self):
        self.headers = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36'}

    def getTorrents(self, imdbId):
        self.headers['Referer'] = self.Base_url

        url = "{Base_url}/movie_details.json?imdb_id={imdbId}";
        results = requests.get(url, headers=self.headers)

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

        details = results.json()

        results.close()
        return details

    def yts():
        f = open("yts_movies.txt", "w")

        for i in range(1, 2):
            url = 'https://yts.am/api/v2/list_movies.json?quality=720p&limit=50&page={}'.format(i)
            response = requests.post(url, headers={"Content-Type": "application/json"})
            #print(response)
            movies = response.json()['data']['movies']
            #print(movies)
            for movie in movies:
                found = False
                tl = movie['title_long']
                #print("*debug first", tl)
                tl = unidecode.unidecode(tl)
                try:
                    torrents = movie['torrents']
                except:
                    next
                url = ""
                for t in torrents:
                    q = t['quality']
                    if (q == "720p"):
                        url = t['url']
                        parsed_url = urlparse(url)
                        hash_value = parsed_url.path.split('/')[-1]
                # print(movie['id'], url, movie['title_long'])
                # f.write("{} {} {}\n".format(movie['id'], url, movie['title_long']))
                print(hash_value)
        f.close()

    def scrape(self):
        magnets = []
        results = []
        for i in range(1, ):
            url = 'https://yts.am/api/v2/list_movies.json?quality=720p&limit=50&page={}'.format(i)
            response = requests.post(url, headers={"Content-Type": "application/json"})
            movies = response.json()['data']['movies']
            for movie in movies:
                found = False
                tl = movie['title_long']
                tl = unidecode.unidecode(tl)
                try:
                    torrents = movie['torrents']
                except:
                    next
                url = ""
                hash_value = ""
                for t in torrents:
                    q = t['quality']
                    if (q == "720p"):
                        url = t['url']
                        parsed_url = urlparse(url)
                        hash_value = parsed_url.path.split('/')[-1]
                # print(movie['id'], url, movie['title_long'])
                # f.write("{} {} {}\n".format(movie['id'], url, movie['title_long']))
                # print(hash_value)
                results.append({
                    'id': movie['id'],
                    'hash': hash_value,
                    'title': movie['title_long'],
                    'url': url,
                })
                magnets.append(hash_value)

        response.close()
        return {'magnets': magnets, 'results': results}

    async def scrape2(self, batch_size=10):
        print("Getting movie list...")
        url = 'https://yts.am/api/v2/list_movies.json?quality=720p&limit=1'
        response = requests.post(url, headers={"Content-Type": "application/json"})
        total_movies = response.json()['data']['movie_count']
        total_pages = total_movies // batch_size
        # magnets = []
        # results = []
        for i in range(1, total_pages+1):
            print("Scraping page: ", i)
            magnets = []
            url = 'https://yts.am/api/v2/list_movies.json?quality=720p&limit={}&page={}'.format(batch_size, i)
            response = requests.post(url, headers={"Content-Type": "application/json"})
            movies = response.json()['data']['movies']
            for movie in movies:
                found = False
                try:
                    torrents = movie['torrents']
                except:
                    next
                url = ""
                hash_value = ""
                for t in torrents:
                    q = t['quality']
                    if (q == "720p"):
                        url = t['url']
                        parsed_url = urlparse(url)
                        hash_value = parsed_url.path.split('/')[-1]
                        magnets.append(hash_value)
                        print("Found torrent for movie: ", movie['title_long'])
                        next
                # magnets.append(hash_value)

            print("Saving magnets to RealDebrid")
            await RealDebrid().saveMagnets(magnets)
        response.close()

# asyncio.run(YifyMoviesAPI().scrape2())