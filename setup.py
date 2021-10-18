"""
AWSConnector setup
"""
from setuptools import setup

if __name__ == "__main__":
    setup(
        name="AWSConnector",
        include_package_data=True,
        data_files=[
            (
                "etc/jupyter/jupyter_server_config.d",
                ["jupyter-config/jupyter_server_config.d/AWSConnector.json"]
            ),
        ]
    )
