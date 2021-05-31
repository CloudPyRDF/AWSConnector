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

	createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {

		this.dialogOpened = false;
		// Create the toolbar button
		let mybutton = new ToolbarButton({
			label: 'My Button',
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
			console.log("Opening...");
			this.dialog = document.createElement('dialog');
			this.dialog.id = 'dialog-with-form';
			this.dialog.innerHTML = 
			'<h1>Configure environment</h1>' +
			'<form id="creds-form">' +
				'<label>Role</label>' +
				'<a href="#" id = "role-more" style="color:blue">' +
					'  more...' +
				'</a>' +
				'<div style="display: none;" id="role-desc">' +
					'<p>' +
						'AWS identity with permission policies that determine what the identity can and cannot do in AWS.' +
					'</p>' +
				'</div><br>' +
				'<input type="text" id="role" name="role" value="default"><br><br>' +


				'<label>Credentials</label>' +
				'<a href="#" id = "creds-more" style="color:blue">' +
					'  more...' +
				'</a>' +
				'<div style="display: none;" id="creds-desc">' +
					'<p>' +
						'AWS security credentials are used to verify whether you have permission to access the requested resources.' +
					'</p>' +
				'</div><br>' +
				'<input type="text" id="creds" name="creds"><br><br>' +


				'<label>Region</label>' +
				'<a href="#" id = "region-more" style="color:blue">' +
					'  more...' +
				'</a>' +
				'<div style="display: none;" id="region-desc">' +
					'<p>' +
						'AWS region is a physical location around the world where a data center is clustered.' +
					'</p>' +
				'</div><br>' +
				'<input type="text" id="region" name="region"><br><br>' +


				'<label>Number of partitions</label>' +
				'<a href="#" id = "parts-more" style="color:blue">' +
					'  more...' +
				'</a>' +
				'<div style="display: none;" id="parts-desc">' +
					'<p>' +
						'The data set will be split into specified number of partitions for computation.' +
					'</p>' +
				'</div><br>' +
				'<input type="text" id="parts" name="parts"><br><br>' +
				'<button type="button" id="submit-btn">Save</button>' +
			'</form>';

			var button = document.createElement('button');
			button.innerText = 'Close';
			button.addEventListener("click", (e:Event) => this.closeDialog());
			this.dialog.appendChild(button);
			document.body.appendChild(this.dialog);

			document.getElementById('role-more').addEventListener("click", (e:Event) => this.toggleMore('role-desc'));
			document.getElementById('creds-more').addEventListener("click", (e:Event) => this.toggleMore('creds-desc'));
			document.getElementById('region-more').addEventListener("click", (e:Event) => this.toggleMore('region-desc'));
			document.getElementById('parts-more').addEventListener("click", (e:Event) => this.toggleMore('parts-desc'));

			document.getElementById('submit-btn').addEventListener("click", (e:Event) => this.submitData(panel));

			this.dialog.show();
			this.dialogOpened = true;
		}
	}

	submitData = async (panel: NotebookPanel): Promise<any> => {
		var role = (<HTMLInputElement>document.getElementById('role')).value;
		var credentials = (<HTMLInputElement>document.getElementById('creds')).value;
		var region = (<HTMLInputElement>document.getElementById('region')).value;
		var partitions = (<HTMLInputElement>document.getElementById('parts')).value;


		
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
		cell.value.text = "!ls";
		await NotebookActions.run(notebook, panel.sessionContext);
		
		console.log(cell.outputs.get(0));

		notebook.model.cells.remove(0);
		notebook.activeCellIndex = oldIndex;


		//exec("mkdir -p ~/.aws && cat <<EOF > ~/.aws/credentials\n" + "[" + role + "]\n" + credentials + "\nEOF", (err:string, stdout:string, stderr:string) => {
		//	if (err) {
		//	  // node couldn't execute the command
		//	  return;
		//	}
		//  
		//	// the *entire* stdout and stderr (buffered)
		//	console.log(`stdout: ${stdout}`);
		//	console.log(`stderr: ${stderr}`);
		//});

		console.log(role);
		console.log(credentials);
		console.log(region);
		console.log(partitions);
	}

	toggleMore(id: string): void {
		var element = document.getElementById(id);
		var display = getComputedStyle(element).display;
		if(display === 'block') {
			document.getElementById(id).style.display = "none";
		} else if(display === 'none') {
			document.getElementById(id).style.display = "block";
		}
	}

	closeDialog(): void {
		console.log("Closing...");
		console.log(this.dialogOpened);
		if(this.dialogOpened) {
			console.log("HERE");
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
};

export default extension;
