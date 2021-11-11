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
  <h1 id="dialog-title">Configure environment</h1>
  <button type="button" class="action-button" id="close-button">
    <span class="material-icons-outlined">
      close
    </span>
  </button>
  <form id="creds-form">
    <label>Credentials</label>
    <button type="button" class="action-button tooltip" id="info-button">
      <span class="material-icons-outlined">
        info
      </span>
      <span class="tooltip-text">
        AWS security credentials are used to verify whether you have permission to access the requested resources.
      </span>
    </button>
    <textarea cols="65" rows="8" id="creds" name="creds" autofocus></textarea><br><br>
    <button type="button" class="connector-button" id="load-btn">
      Search for local credentials
    </button>
    <button type="button" class="connector-button" id="submit-btn">
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

  async sendGetRequest(): Promise<void> {
    const settings = ServerConnection.makeSettings({});
    const serverResponse = await ServerConnection.makeRequest(
      URLExt.join(settings.baseUrl, '/AWSConnector'),
      { method: 'GET' },
      settings
    );
    const response = await serverResponse.json();
    this.setCredentials(response['data']);
  }

  async sendSetRequest(): Promise<void> {
    const settings = ServerConnection.makeSettings({});
    await ServerConnection.makeRequest(
      URLExt.join(settings.baseUrl, '/AWSConnector'),
      { method: 'PUT', body: JSON.stringify({ data: this.credentials }) },
      settings
    );
  }

  setCredentials(creds: string): void {
    this.credentials = creds;
    this.setData();
  }

  openDialog(): void {
    if (!this.dialogOpened) {
      this.shadowBox = document.createElement('div');
      this.shadowBox.id = 'shadow-box';

      this.dialog = document.createElement('dialog');
      this.dialog.innerHTML = dialogHTML;

      this.dialog.id = 'connector-dialog';
      this.dialog.classList.add('connector-dialog-desc-hidden');

      this.shadowBox.appendChild(this.dialog);
      document.body.appendChild(this.shadowBox);

      document
        .getElementById('close-button')
        ?.addEventListener('click', () => this.closeDialog());

      document
        .getElementById('load-btn')
        ?.addEventListener('click', () => this.loadData());

      document
        .getElementById('submit-btn')
        ?.addEventListener('click', () => this.submitData());

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

    this.closeDialog();
    this.showSnackbar();
  }

  closeDialog(): void {
    this.saveData();

    if (this.dialogOpened) {
      document.body.removeChild(document.getElementById('shadow-box'));
      this.dialogOpened = false;
    }
  }

  addSnackbar(): void {
    const snackbar = document.createElement('div');
    snackbar.id = 'snackbar';
    snackbar.innerHTML = snackbarHTML;
    document.body.appendChild(snackbar);
  }

  showSnackbar(): void {
    const snackbar = document.getElementById('snackbar');
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
