from tornado import web
from urllib.parse import unquote
from notebook.base.handlers import IPythonHandler

class TabNineHandler(IPythonHandler):
    def initialize(self, tabnine):
        self.tabnine = tabnine

    @web.authenticated
    async def get(self):
        url_params = self.request.uri
        request_data = unquote(url_params[url_params.index('=')+1:])
        response = self.tabnine.request(request_data)
        self.write(response)
