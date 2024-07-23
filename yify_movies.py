import requests
import re
from bs4 import BeautifulSoup

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