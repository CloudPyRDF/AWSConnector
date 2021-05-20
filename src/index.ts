import {
	  JupyterFrontEnd,
	    JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
	  ToolbarButton,
} from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { IDisposable } from '@lumino/disposable';


export class ButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {

	  createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
		      // Create the toolbar button
		          let mybutton = new ToolbarButton({
				          label: 'My Button',
					          onClick: () => alert('You did it!')
						      });

						          // Add the toolbar button to the notebook toolbar
							      panel.toolbar.addItem('mybutton', mybutton);

							          // The ToolbarButton class implements `IDisposable`, so the
								      // button *is* the extension for the purposes of this method.
								          return mybutton;
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
