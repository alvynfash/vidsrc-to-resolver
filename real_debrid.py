import asyncio
from rdapi import RD

class RealDebrid():

    def __init__(self):
        self.RD = RD()

    movie_extensions = [
        '.mkv', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm',
        '.vob', '.ogv', '.ogg', '.drc', '.gifv', '.mng', '.avi',
        '.mov', '.qt', '.wmv', '.yuv', '.rm', '.rmvb', '.asf',
        '.amv', '.mp4', '.m4p', '.m4v', '.mpg', '.mp2', '.mpeg',
        '.mpe', '.mpv', '.mpg', '.mpeg', '.m2v', '.m4v', '.svi',
        '.3gp', '.3g2', '.mxf', '.roq', '.nsv', '.flv', '.f4v',
        '.f4p', '.f4a', '.f4b',
    ]

    testMagnets = [
        'A98D1D33B885B6A7ED105020F166293468B2765F',
        'B8A1E5F8DAF36FC5D7FFBA6223AE3B4FCDA595E2',
        '1D34B86400450E8ED25A612335346D195B873491',
    ]

    # print(RD.user.get().json())
    # print(RD.torrents.get(limit=10).json())

    async def saveMagnets(self, magnets):
        for magnet in magnets:
            print('Adding magnet: ', magnet)
            magnetResult = self.RD.torrents.add_magnet(magnet).json()
            magnetId = magnetResult['id']

            if not magnetId:
                continue

            infoResult = self.RD.torrents.info(id=magnetId).json()
            files = infoResult['files']
            movie_files = [file for file in files if any(file['path'].endswith(ext) for ext in self.movie_extensions)]
            if (len(movie_files) == 0):
                print('Removing magnet: ', magnet)
                self.RD.torrents.delete(id=magnetId)
                continue

            if (len(movie_files) > 0):
                file_ids = [file['id'] for file in movie_files]
                file_ids_str = ','.join(str(file_id) for file_id in file_ids)
                id = infoResult['id']
                selectFilesresult = self.RD.torrents.select_files(id=id, files=file_ids_str)

            # k = RD.torrents.instant_availability('FE7E3784A298169D8DE3804B8FDE5EC318105194')
            # RD.unrestrict.link(link=url)
            # print(RD.torrents.get(limit=10).json())

# k = RealDebrid().RD.user.get().json()
# k = RealDebrid().RD.torrents.get(limit=50).json()
# print(k)
# asyncio.run(RealDebrid().saveMagnets(magnets=[ '59A4EE31CD1DDDDD3CC345F92C77F29C89C18882',]))