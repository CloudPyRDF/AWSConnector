
import json
from pathlib import Path

from ._version import __version__

HERE = Path(__file__).parent.resolve()

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": data["name"]
    }]

def _jupyter_nbextension_paths():
    """ Used by "jupyter nbextension" command to install frontend extension """
    return [dict(
        section="notebook",
        dest="AWSConnector",
        require="AWSConnector/extension"),
    ]
