import {
	  JupyterFrontEnd,
	    JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
	  ToolbarButton
} from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { ICellModel, isCodeCellModel } from "@jupyterlab/cells";

import { NotebookActions, NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { IDisposable } from '@lumino/disposable';





export class ButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {

	dialog: HTMLDialogElement;

	dialogOpened: boolean;

	credentials: string;

	createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {

		this.dialogOpened = false;
		// Create the toolbar button
		let mybutton = new ToolbarButton({
			label: 'AWS Connector',
			onClick: () => this.openDialog(panel)
		});


		// Add the toolbar button to the notebook toolbar
		panel.toolbar.addItem('mybutton', mybutton);

		// The ToolbarButton class implements `IDisposable`, so the
		// button *is* the extension for the purposes of this method.
		return mybutton;
	}

	openDialog(panel: NotebookPanel): void {

		console.log("Opening dialog");
		
		if(!this.dialogOpened) {


			console.log(this.credentials);


			console.log("Opening...");
			this.dialog = document.createElement('dialog');
			this.dialog.id = 'dialog-with-form';
			this.dialog.innerHTML = 
			'<h1 style="font-family:Arial">Configure environment</h1>' +
			'<button type="button" id="close-button" style="position: absolute; right: 0; top: 0">X</button>' +
			'<form id="creds-form">' +

					'<label>Credentials</label>' +
					'<a href="#" id = "creds-more" style="color:blue; font-size:12px">' +
						'   more...' +
					'</a>' +
					'<div style="display: none;" id="creds-desc">' +
						'<p>' +
							'AWS security credentials are used to verify whether you have permission to access the requested resources.' +
						'</p>' +
					'</div>' +
					'<textarea style="resize:none" cols="68" rows="8" id="creds" name="creds"></textarea><br><br>' +

					'<button type="button" id="load-btn">Search for local credentials</button>' +
					'<br><br>' +
					'<button type="button" id="submit-btn">Save</button>' +
			'</form>';

			this.dialog.style.height = "310px";
			this.dialog.style.width = "500px";

			document.body.appendChild(this.dialog);

			document.getElementById('close-button').addEventListener("click", (e:Event) => this.closeDialog());

			document.getElementById('creds-more').addEventListener("click", (e:Event) => this.toggleMore('creds-desc'));

			document.getElementById('load-btn').addEventListener("click", (e:Event) => this.loadData(panel));

			document.getElementById('submit-btn').addEventListener("click", (e:Event) => this.submitData(panel));

			this.setData();

			this.dialog.show();
			this.dialogOpened = true;
		}
	}

	loadData = async (panel: NotebookPanel): Promise<any> => {
		const notebook = panel.content;

		const newCell = notebook.model.contentFactory.createCodeCell({});


		let oldIndex = notebook.activeCellIndex;

		notebook.model.cells.insert(0, newCell);
		notebook.activeCellIndex = 0;


		notebook.activeCell.hide();

		const cell: ICellModel = notebook.model.cells.get(0);
		if (!isCodeCellModel(cell)) {
		throw new Error("cell is not a code cell.");
		}

		cell.value.text = "!cat ~/.aws/credentials";

		await NotebookActions.run(notebook, panel.sessionContext);
		
		try {
			var out = cell.outputs.toJSON();
			console.log(out[0]["text"]);
			var data = out[0]["text"].toString();
			if(data.includes("aws_access_key")) {
				this.credentials = data;
				this.setData();
			}
		} catch(error) {
			console.log("No credentials found");
		}

		notebook.model.cells.remove(0);
		notebook.activeCellIndex = oldIndex;
	}

	setData(): void {
		if(this.credentials)
			(<HTMLInputElement>document.getElementById('creds')).value = this.credentials;
	}

	saveData(): void {
		this.credentials = (<HTMLInputElement>document.getElementById('creds')).value;
		//this.region = (<HTMLInputElement>document.getElementById('region')).value;
		//this.numberOfPartitions = (<HTMLInputElement>document.getElementById('parts')).value;
	}

	submitData = async (panel: NotebookPanel): Promise<any> => {
		
		this.saveData();
		
		const notebook = panel.content;

		const newCell = notebook.model.contentFactory.createCodeCell({});


		let oldIndex = notebook.activeCellIndex;

		notebook.model.cells.insert(0, newCell);
		notebook.activeCellIndex = 0;


		notebook.activeCell.hide();

		const cell: ICellModel = notebook.model.cells.get(0);
		if (!isCodeCellModel(cell)) {
		throw new Error("cell is not a code cell.");
		}
		if(this.credentials == "") {
			//TODO: do something
		}

		cell.value.text = "!mkdir -p ~/.aws && printf \"" + this.credentials.split("\n").join("\\n") + "\" > ~/.aws/credentials";

		await NotebookActions.run(notebook, panel.sessionContext);
		
		console.log(cell.outputs.get(0));

		notebook.model.cells.remove(0);
		notebook.activeCellIndex = oldIndex;

		console.log(this.credentials);

		this.closeDialog();
	}

	toggleMore(id: string): void {
		var element = document.getElementById(id);
		var display = getComputedStyle(element).display;
		if(display === 'block') {
			document.getElementById(id).style.display = "none";
			this.dialog.style.height = "310px";
		} else if(display === 'none') {
			document.getElementById(id).style.display = "block";
			this.dialog.style.height = "350px";
		}
	}

	closeDialog(): void {

		this.saveData();

		console.log("Closing...");
		if(this.dialogOpened) {
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
		const your_button = new ButtonExtension();
		app.docRegistry.addWidgetExtension('Notebook', your_button);
	}
}

export default extension;
