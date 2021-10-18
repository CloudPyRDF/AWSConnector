from .aws_connector import ConnectorHandler

def _jupyter_server_extension_points():
    return [{
        "module": "AWSConnector"
    }]

def load_jupyter_server_extension(server_app):
    handlers = [("/AWSConnector", ConnectorHandler)]
    server_app.web_app.add_handlers(".*$", handlers)
