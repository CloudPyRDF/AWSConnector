
from jupyter_server.base.handlers import JupyterHandler
import json
import tornado

class ConnectorHandler(JupyterHandler):
    @tornado.web.authenticated
    def get(self):
        with open('/root/.aws/credentials', 'r') as f:
            contents = f.readlines()
            self.write(json.dumps({'data': ''.join(contents)}))

    @tornado.web.authenticated
    def set(self):
        body = self.get_json_body()
        with open('/root/.aws/credentials', 'w') as f:
            f.write(body['data'])
            self.write(json.dumps({'status': 'OK'}))
