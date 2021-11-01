
from jupyter_server.base.handlers import JupyterHandler
import json
import tornado
import pathlib
import os

home = os.getenv('HOME')

class ConnectorHandler(JupyterHandler):
    @tornado.web.authenticated
    def get(self):
        try:
            with open(home + '/.aws/credentials', 'r') as f:
                contents = f.read()
        except FileNotFoundError:
            contents = ''

        self.write(json.dumps({'data': contents}))

    @tornado.web.authenticated
    def put(self):
        data = self.get_json_body()['data']
        try:
            pathlib.Path(home + '/.aws').mkdir(exist_ok=True)
            with open(home + '/.aws/credentials', 'w') as f:
                f.write(data)
        except FileNotFoundError as e:
            pass

        self.write(json.dumps({'status': 'OK'}))
