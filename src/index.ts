import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ToolbarButton } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { Kernel, KernelMessage } from '@jupyterlab/services';

import { IDisposable } from '@lumino/disposable';

import { JSONValue } from '@lumino/coreutils';

export class AWSConnectorExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  dialog: HTMLDialogElement;

  dialogOpened: boolean;

  credentials: string;

  comm: Kernel.IComm;

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    this.dialogOpened = false;

    const toolbarButton = new ToolbarButton({
      label: 'AWS Connector',
      onClick: () => this.openDialog()
    });

    panel.toolbar.addItem('connectorButton', toolbarButton);

    this.startComm(panel);
    return toolbarButton;
  }

  send(msg: JSONValue): void {
    this.comm.send(msg);
  }

  sendGetRequest(): void {
    this.send({ action: 'awsconn-get-request' });
  }

  sendSetRequest(): void {
    this.send({ action: 'awsconn-set-request', credentials: this.credentials });
  }

  commCallback(msg: KernelMessage.ICommMsgMsg): void | Promise<void> {
    switch (msg.content.data.action) {
      case 'awsconn-get-response':
        this.setCredentials(msg.content.data.creds as string);
        break;
      case 'awsconn-set-response':
        break;
    }
  }

  setCredentials(creds: string): void {
    this.credentials = creds;
    this.setData();
  }

  startComm(panel: NotebookPanel): void {
    if (this.comm) {
      this.comm.close();
    }

    console.log('AWSConnector: Starting Comm with kernel');

    panel.sessionContext.ready.then(() => {
      this.comm =
        panel.sessionContext.session.kernel.createComm('AWSConnector');
      this.comm.onMsg = (msg: KernelMessage.ICommMsgMsg) =>
        this.commCallback(msg);
    });
  }

  openDialog(): void {
    console.log('Opening dialog');

    if (!this.dialogOpened) {
      console.log(this.credentials);

      console.log('Opening...');
      this.dialog = document.createElement('dialog');
      this.dialog.id = 'dialog-with-form';
      this.dialog.innerHTML = `
        <h1 id="dialog-title">Configure environment</h1>
        <button type="button" id="close-button">X</button>
        <form id="creds-form">
					<label>Credentials</label>
					<a href="#" id="creds-more">
						 more...
					</a>
					<div id="creds-desc">
						<p>
							AWS security credentials are used to verify whether you have permission to access the requested resources.
						</p>
					</div>
					<textarea cols="65" rows="8" id="creds" name="creds"></textarea><br><br>
					<button type="button" class="connector-button" id="load-btn">
					  Search for local credentials
          </button>
					<button type="button" class="connector-button" id="submit-btn">
					  Save
					</button>
        </form>
			`;

      this.dialog.id = 'connector-dialog';
      this.dialog.classList.add('connector-dialog-desc-hidden');

      document.body.appendChild(this.dialog);

      document
        .getElementById('close-button')
        .addEventListener('click', () => this.closeDialog());

      document
        .getElementById('creds-more')
        .addEventListener('click', () => this.toggleMore('creds-desc'));

      document
        .getElementById('load-btn')
        .addEventListener('click', () => this.loadData());

      document
        .getElementById('submit-btn')
        .addEventListener('click', () => this.submitData());

      this.setData();

      this.dialog.show();
      this.dialogOpened = true;
    }
  }

  loadData(): void {
    this.sendGetRequest();
  }

  setData(): void {
    if (this.credentials) {
      (<HTMLInputElement>document.getElementById('creds')).value =
        this.credentials;
    }
  }

  saveData(): void {
    this.credentials = (<HTMLInputElement>(
      document.getElementById('creds')
    )).value;
  }

  submitData(): void {
    this.saveData();

    if (this.credentials.trim() !== '') {
      this.sendSetRequest();
    }

    console.log(this.credentials);

    this.closeDialog();
  }

  toggleMore(id: string): void {
    const element = document.getElementById(id);
    const display = getComputedStyle(element).display;
    if (display === 'block') {
      document.getElementById(id).style.display = 'none';
      this.dialog.classList.replace(
        'connector-dialog-desc-shown',
        'connector-dialog-desc-hidden'
      );
    } else if (display === 'none') {
      document.getElementById(id).style.display = 'block';
      this.dialog.classList.replace(
        'connector-dialog-desc-hidden',
        'connector-dialog-desc-shown'
      );
    }
  }

  closeDialog(): void {
    this.saveData();

    console.log('Closing...');
    if (this.dialogOpened) {
      document.body.removeChild(document.getElementById('dialog-with-form'));
      this.dialogOpened = false;
    }
  }
}

/**
 * Initialization data for the AWSConnector extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'AWSConnector:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension AWSConnector is activated!');
    const connectorExtension = new AWSConnectorExtension();
    app.docRegistry.addWidgetExtension('Notebook', connectorExtension);
  }
};

export default extension;
