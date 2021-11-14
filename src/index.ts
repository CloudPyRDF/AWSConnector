import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ToolbarButton } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { IDisposable } from '@lumino/disposable';

import { ServerConnection } from '@jupyterlab/services';

import { URLExt } from '@jupyterlab/coreutils';

const dialogHTML = `
  <h1 id="aws-connector-dialog-title">Configure environment</h1>
  <button type="button" class="aws-connector-action-button" id="aws-connector-close-button">
    <span class="material-icons-outlined">
      close
    </span>
  </button>
  <form id="aws-connector-credentials-form">
    <label>Credentials</label>
    <button type="button" class="aws-connector-action-button aws-connector-tooltip" id="aws-connector-info-button">
      <span class="material-icons-outlined">
        info
      </span>
      <span class="tooltip-text">
        AWS security credentials are used to verify whether you have permission to access the requested resources.
      </span>
    </button>
    <textarea cols="65" rows="8" id="aws-connector-credentials-text" name="credentials-text" autofocus></textarea><br><br>
    <button type="button" class="aws-connector-button" id="aws-connector-load-button">
      Search for local credentials
    </button>
    <button type="button" class="aws-connector-button" id="aws-connector-submit-button">
      Save
    </button>
  </form>
  `;

const snackbarHTML = `
  <span class="material-icons-outlined">
    check
  </span>
  <p>
    Credentials saved successfully
  </p>
  `;

export class AWSConnectorExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  shadowBox: HTMLDivElement;

  dialog: HTMLDialogElement;

  dialogOpened: boolean;

  credentials: string;

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

    this.addIconLink();

    this.addSnackbar();

    return toolbarButton;
  }

  addIconLink(): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined';
    document.head.appendChild(link);
  }

  async sendGetRequest(): Promise<any> {
    const settings = ServerConnection.makeSettings({});
    const serverResponse = await ServerConnection.makeRequest(
      URLExt.join(settings.baseUrl, '/AWSConnector'),
      { method: 'GET' },
      settings
    );
    return serverResponse.json();
  }

  async sendSetRequest(): Promise<void> {
    const settings = ServerConnection.makeSettings({});
    await ServerConnection.makeRequest(
      URLExt.join(settings.baseUrl, '/AWSConnector'),
      { method: 'PUT', body: JSON.stringify({ data: this.credentials }) },
      settings
    );
  }

  setCredentials(credentials: string): void {
    this.credentials = credentials;
    this.setData();
  }

  openDialog(): void {
    if (!this.dialogOpened) {
      this.shadowBox = document.createElement('div');
      this.shadowBox.id = 'aws-connector-shadow-box';

      this.dialog = document.createElement('dialog');
      this.dialog.innerHTML = dialogHTML;

      this.dialog.id = 'aws-connector-dialog';

      this.shadowBox.appendChild(this.dialog);
      document.body.appendChild(this.shadowBox);

      document
        .getElementById('aws-connector-close-button')
        ?.addEventListener('click', () => this.closeDialog());

      document
        .getElementById('aws-connector-load-button')
        ?.addEventListener('click', () => this.loadData());

      document
        .getElementById('aws-connector-submit-button')
        ?.addEventListener('click', () => this.submitData());

      this.setData();

      this.dialog.show();
      this.dialogOpened = true;
    }
  }

  loadData(): void {
    this.sendGetRequest().then(response =>
      this.setCredentials(response['data'])
    );
  }

  setData(): void {
    if (this.credentials) {
      (<HTMLInputElement>(
        document.getElementById('aws-connector-credentials-text')
      )).value = this.credentials;
    }
  }

  saveData(): void {
    this.credentials = (<HTMLInputElement>(
      document.getElementById('aws-connector-credentials-text')
    )).value;
  }

  submitData(): void {
    this.saveData();

    if (this.credentials.trim() !== '') {
      this.sendSetRequest().then(() => {
        this.closeDialog();
        this.showSnackbar();
      });
    }
  }

  closeDialog(): void {
    this.saveData();

    if (this.dialogOpened) {
      document.body.removeChild(
        document.getElementById('aws-connector-shadow-box')
      );
      this.dialogOpened = false;
    }
  }

  addSnackbar(): void {
    const snackbar = document.createElement('div');
    snackbar.id = 'aws-connector-snackbar';
    snackbar.innerHTML = snackbarHTML;
    document.body.appendChild(snackbar);
  }

  showSnackbar(): void {
    const snackbar = document.getElementById('aws-connector-snackbar');
    snackbar.className = 'show';
    setTimeout(() => {
      snackbar.className = snackbar.className.replace('show', '');
    }, 3000);
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
