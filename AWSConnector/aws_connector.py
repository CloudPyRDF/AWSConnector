ipykernel_imported = True
try:
    from ipykernel import zmqshell
except ImportError:
    ipykernel_imported = False

import logging


class AWSConnector:

    def __init__(self, ipython, logger):
        self.ipython = ipython
        self.logger = logger
        self.connected = False


def load_ipython_extension(ipython):
    """ Load Jupyter kernel extension """

    logger = logging.getLogger('awsconnector.connector')
    logger.name = 'AWSConnector.connector'
    logger.setLevel(logging.INFO)
    logger.propagate = True

    if ipykernel_imported:
        if not isinstance(ipython, zmqshell.ZMQInteractiveShell):
            logger.error("AWSConnector: Ipython not running through notebook. Exiting.")
            return
    else:
        return

    logger.info("Starting AWSConnector Kernel Extension")
    connector = AWSConnector(ipython, logger)
