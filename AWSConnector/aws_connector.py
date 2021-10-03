ipykernel_imported = True
try:
    from ipykernel import zmqshell
except ImportError:
    ipykernel_imported = False

import logging


class AWSConnector:

    def __init__(self, ipython, log):
        self.ipython = ipython
        self.log = log
        self.connected = False


def load_ipython_extension(ipython):
    """ Load Jupyter kernel extension """

    log = logging.getLogger('awsconnector.connector')
    log.name = 'AWSConnector.connector'
    log.setLevel(logging.INFO)
    log.propagate = True

    if ipykernel_imported:
        if not isinstance(ipython, zmqshell.ZMQInteractiveShell):
            log.error("AWSConnector: Ipython not running through notebook. Exiting.")
            return
    else:
        return

    log.info("Starting AWSConnector Kernel Extension")
    connector = AWSConnector(ipython, log)
