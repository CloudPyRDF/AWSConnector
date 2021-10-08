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

    def register_comm(self):
        self.ipython.kernel.comm_manager.register_target("AWSConnector", self.target_func)

    def send(self, msg):
        """Send a message to the frontend"""
        self.comm.send(msg)

    def send_current_credentials(self):
        with open('~/.aws/credentials', 'r') as file:
            contents = file.readlines()
        self.send({'action': 'awsconn-get-response', 'creds': contents})

    def save_credentials(self, creds):
        with open('~/.aws/credentials', 'w') as file:
            file.write(creds)
        self.send({'action': 'awsconn-set-response', 'status': 'ok'})

    def handle_comm_message(self, msg):
        """ Handle message received from frontend """

        action = msg['content']['data']['action']

        # Try to get a kerberos ticket
        if action == 'awsconn-get-request':
            self.send_current_credentials()
        elif action == 'awsconn-set-request':
            self.save_credentials(msg['content']['data']['credentials'])
        else:
            # Unknown action requested
            self.logger.error("Received wrong message: %s", str(msg))
            return

    def target_func(self, comm, msg):
        """ Callback function to be called when a frontend comm is opened """
        self.logger.info("Established connection to frontend")
        self.logger.debug("Received message: %s", str(msg))
        self.comm = comm

        @self.comm.on_msg
        def _recv(msg):
            self.handle_comm_message(msg)

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
    connector.register_comm()
