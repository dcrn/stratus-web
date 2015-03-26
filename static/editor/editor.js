/*
 The 'controller' component of the Editor.
 Receives events and updates the gamedata JSON object accordingly.
 Tells the views to update when necessary.
*/

var Editor = Editor || {};
Editor.init = function(gamedata, repodata) {
	// Default gamedata and repodata to empty objects
	this.gamedata = gamedata || {};
	this.gamedata.scenes = this.gamedata.scenes || {};
	this.repodata = repodata || {};
	this.repodata.components = this.repodata.components || {};
	this.selection = {};
	this.scriptviews = {};
	this.unsaved = false;

	// Set up Handlebars helpers
	Handlebars.registerHelper('eq', 
		function (context, value, options) {
			if (context.valueOf() === value)
				return options.fn(this);
			else
				return options.inverse(this);
	});

	Handlebars.registerHelper('isArray', 
		function (context, options) {
			if (Handlebars.Utils.isArray(context))
				return options.fn(this);
			else
				return options.inverse(this);
	});

	// Initialise views
	this.view = new EditorView();
	this.view.render();

	this.view.main.scene.setData(gamedata);
	this.view.explorer.scenes.setData(gamedata.scenes);
	this.view.explorer.scripts.setData(repodata.components);

	// Re-render scene to fix camera perspective
	this.view.main.scene.render();

	// Events
	window.onbeforeunload = this.onClose.bind(this);
	window.addEventListener('blur', this.onBlur.bind(this));
}

Editor.selectScene = function(s) {
	// Selecting a scene will de-select everything else.
	this.selection.scene = s;
	delete this.selection.entity;
	delete this.selection.component;

	// Update the properties view to no entity selected
	this.view.main.properties.setData(null);

	// Change the active scene in the SceneView.
	this.view.main.scene.setActiveScene(s);
}

Editor.selectEntity = function(e) {
	// Selecting an entity deselects components
	this.selection.entity = e;
	delete this.selection.component;

	// Update the properties view with the specific gamedata related to the selected entity
	this.view.main.properties.setData(
		this.gamedata.scenes[this.selection.scene].entities[e]
	);

	// Change the currently selected entity in the SceneView.
	this.view.main.scene.setSelection(e);
}

Editor.selectComponent = function(c) {
	this.selection.component = c;
}

Editor.modified = function() {
	// Called when a modification is made to the gamedata.
	// If this is called again before the timer finishes, it is reset to 4 secons.
	if (this.savetimer) 
		clearTimeout(this.savetimer);

	// Auto-save at the end of this timer
	this.savetimer = setTimeout(this.autoSave.bind(this), 4000);
}

Editor.onClose = function() {
	// If the editor is closed, save immediately 
	
	if (this.savetimer) {
		clearTimeout(this.savetimer);
		
		// synchronously, so the page doesn't close before it gets saved
		this.autoSave(true);
	}

	// Save any open script tabs
	Editor.saveAllScripts(true);
}

Editor.onBlur = function() {
	// Save any changes whenever the user changes tab in their browser

	if (this.savetimer) {
		clearTimeout(this.savetimer);
		this.autoSave();
	}
	Editor.saveAllScripts(true);
}

Editor.autoSave = function(sync) {
	// Save the gamedata JSON using Ajax, either asynchronously or synchronously if the page is closing.
	// The gamedata is serialised using JSON.stringify before sending.
	$.ajax({
		type:'POST', 
		async: !sync,
		data: JSON.stringify(this.gamedata, null, '\t') + '\n', 
		url: window.location.pathname + 
			'/gamedata.json'
	});
}

Editor.saveAllScripts = function(sync) {
	for (var f in this.scriptviews) {
		this.saveScript(f, sync);
	}
}

Editor.saveScript = function(filename, sync) {
	// Save a script based on it's filename, assuming there's an editor open for it
	if (!this.scriptviews[filename]) {
		return;
	}

	// Upload the component to /editor/<repo>/components/filename with ajax
	$.ajax({
		type:'POST', 
		async: !sync,
		data: this.scriptviews[filename].getData(), 
		url: window.location.pathname + 
			'/components/' + 
			filename
	});
}

Editor.editScript = function(filename) {
	// Begin editing a script. This is received from the ExplorerScriptsItemView class
	// Opens a new tab on the Main view, which contains a ScriptView object.

	// Ignores it if there is already a scriptview open with this filename
	if (this.scriptviews[filename]) {
		return;
	}
	var self = this;

	// Create the scriptview and tab, with a close button that will
	// automatically save and close the tab when clicked.
	this.scriptviews[filename] = new ScriptView(filename);
	this.view.main.add(this.scriptviews[filename], {
		title: filename, 
		button: 'remove', 
		callback: function(v, item, panel) {
			self.scriptviews[filename].autoSave();
			v.remove(item, panel);
			v.showTab(0);
			delete self.scriptviews[filename];
		}
	});

	// Load the contents of the component from the server using AJAX
	// When it's loaded, set the data of the scriptview to it.
	$.ajax({
		type:'GET', 
		url: window.location.pathname + 
			'/components/' + 
			filename, 
		success: function(data) {
			self.scriptviews[filename].setData(data);
			self.view.main.tabs.showTab(
				self.view.main.tabs.numTabs() - 1
			);
		}
	});
}

Editor.deleteScript = function(filename) {
	// Delete a script from the server
	// Displays a modal pop-up with bootstrap that will confirm the action

	var self = this;
	this.view.showModalInput({
		title: 'Delete ' + filename + '?',
		callback: function() {

			// When the user hits 'yes', tell the server to delete the file using ajax
			$.ajax({
				type: 'DELETE',
				url: window.location.pathname + 
					'/components/' + filename,
				success: function() {

					// When the file is deleted, remove any references of it
					delete self.repodata.components[filename];
					self.view.explorer.scripts.setData(self.repodata.components);

					// if there's a scriptview open with this file, then delete the scriptview tab without saving it.
					if (self.scriptviews[filename]) {
						var tab = self.view.main.tabs.findTab(self.scriptviews[filename]);
						
						if (tab) {
							self.view.main.tabs.remove(tab.item, tab.panel);
							self.view.main.tabs.showTab(
								self.view.main.tabs.numTabs() - 1
							);
						}
						delete self.scriptviews[filename];
					}
				}
			});
		}
	});
}

Editor.duplicateScript = function(srcfile) {
	// Duplicate an existing script
	// Shows a modal for selecting a name for the new copy

	var self = this;
	this.view.showModalInput({
		title: 'Duplicate Script',
		inputs: {filename: {type: 'text', value: ''}},
		callback: function(val) {
			var filename = val.filename.trim();
			if (filename == '') return;
			if (filename.slice(-3) !== '.js')
				filename += '.js';

			// GET the contents of the original file, then POST them back
			// with the specified filename
			$.ajax({
				type:'GET', 
				data: '', 
				url: window.location.pathname + 
					'/components/' + srcfile,
				success: function(data) {
					$.ajax({
						type:'POST', 
						data: data, 
						url: window.location.pathname + 
							'/components/' + filename,
						success: function() {
							// Add the new script to the explorer
							self.repodata.components[filename] = true;
							self.view.explorer.scripts.setData(self.repodata.components);
						}
					});
				}
			});
		}
	});
}

Editor.newScript = function() {
	// Create an entirely new script
	// Show a pop-up to ask for the filename

	var self = this;
	this.view.showModalInput({
		title: 'New Script Component',
		inputs: {filename: {type: 'text', value: ''}},
		callback: function(val) {
			var filename = val.filename.trim();
			if (filename == '') return;
			if (filename.slice(-3) !== '.js')
				filename += '.js';

			// POST to the server to create the file
			$.ajax({
				type:'POST', 
				data: '', 
				url: window.location.pathname + 
					'/components/' + filename,
				success: function() {
					// Add the new script to the explorer view
					self.repodata.components[filename] = true;
					self.view.explorer.scripts.setData(self.repodata.components);
				}
			});
		}
	});
}

Editor.newScene = function() {
	// Creates a new scene in the game
	// Asks the user for an ID for the scene

	var self = this;
	// Show a modal input from the Editor view, with an ID input.
	this.view.showModalInput({
		title: 'New Scene',
		inputs: {ID: {type: 'text', value: ''}},
		callback: function(val) {
			if (!val.ID) return;
			val.ID = val.ID.trim();
			if (val.ID === '') return;

			// Create the scene structure in the gamedata object
			// Add a default camera entity to every new scene
			self.gamedata.scenes[val.ID] = {entities:{"default camera": {
					"transform": {
						"position": {
							"type": "vector",
							"parameters": [
								0,
								-46.72116875172894,
								62.853930566438855
							]
						},
						"rotation": {
							"type": "quaternion",
							"parameters": [
								0.384808188808245,
								0,
								0,
								0.9229965643631173
							]
						}
					},
					"camera": {}
 				}
 			}};

 			// Add the scene to the scene and explorer views
			self.view.main.scene.addScene(val.ID, self.gamedata.scenes[val.ID]);
			self.view.explorer.scenes.addItem(null, null, 'scene', val.ID, self.gamedata.scenes[val.ID].entities);

			// Select the newly created scene
			self.selectScene(val.ID);

			// Set the gamedata to 'modified', which will trigger an autosave.
			self.modified();
		}
	});
}

Editor.openSettings = function() {
	// Open the settings modal, which shows some inputs for setting
	// Game properties like pointerlock, shadows, default scene.

	var self = this;
	this.view.showSettingsModal(this.gamedata.config, function(r) {
		self.gamedata.config = r;
		self.view.main.scene.updateSettings(r);
		self.modified();
	});
}

Editor.performAction = function(type, action) {
	/* Performs one of the actions available on the 
	 Explorer, such as adding, duplicating, or removing 
	 a scene, entity or component */

	var self = this;

	if (type == 'scene') {
		if (action == 'add') {
			// Add a new entity to the selected scene
			// Ask the user for an entity ID
			var sc = this.gamedata.scenes[this.selection.scene];
			this.view.showModalInput({
				title: 'New Entity',
				inputs: {ID: {type: 'text', value: ''}},
				callback: function(val) {
					if (!val.ID) return;
					val.ID = val.ID.trim();
					if (val.ID === '') return;

					// Create a new entity in the selected scene, with a transform component by default
					sc.entities[val.ID] = {transform:{}};

					// Add the entity to the explorer
					self.view.explorer.scenes.addItem(
						self.selection.scene, 
						null, 
						'entity', 
						val.ID, 
						{}
					);
					// Add the trans form component to the explorer
					self.view.explorer.scenes.addItem(
						self.selection.scene, val.ID, 'component', 'transform', {}
					);

					// Add the entity and component to the sceneview
					self.view.main.scene.addEntity(self.selection.scene, val.ID);
					self.view.main.scene.addComponent(self.selection.scene, val.ID, 'transform');

					// Set the gamedata as recently modified
					self.modified();
				}
			});
		}
		else if (action == 'delete') {
			// Delete a scene, asking if the user really wants to do this
			this.view.showModalInput({
				title: 'Delete ' + this.selection.scene + '?',
				callback: function(val) {
					// Remove the scene from gamedata, explorer and sceneview
					delete self.gamedata.scenes[self.selection.scene];
					self.view.explorer.scenes.removeItem('scene', self.selection.scene);
					self.view.main.scene.removeScene(self.selection.scene);

					// deselect the scene
					self.selectScene(null);

					// Set to autosave the change
					self.modified();
				}
			});
		}
		else if (action == 'duplicate') {
			// Duplicate the selected scene, ask the user for an ID for the new scene
			var self = this;
			this.view.showModalInput({
				title: 'Duplicate Scene',
				inputs: {ID: {type: 'text', value: ''}},
				callback: function(val) {
					var ID = val.ID.trim();
					if (ID == '') return;

					// Get the selected scene and copy it using jQuery.extend's "deep" copy mode.
					var sc = self.gamedata.scenes[self.selection.scene];
					var cpy = $.extend(true, {}, sc);

					// Add the scene to the gamedata and views
					self.gamedata.scenes[ID] = cpy;
					self.view.main.scene.addScene(ID, cpy);
					self.view.explorer.scenes.addItem(null, null, 'scene', ID, cpy.entities || {});

					self.modified();
				}
			});
		}
	}
	else if (type == 'entity') {
		if (action == 'add') {
			// Add a component to the currently selected entity
			var sc = this.gamedata.scenes[this.selection.scene];
			var ent = sc.entities[this.selection.entity];

			// Show a modal input, which lets the user select from the list of components or input a component ID manually
			this.view.showModalInput({
				title: 'Add Component',
				inputs: {ScriptComponentID: {type: 'text', value: ''}, 'OR':{type:'none', value:''}, ComponentList: {type: Components.list(), value: ''}},
				callback: function(val) {
					var comp = (val.ScriptComponentID || '').trim();
					if (!comp) {
						comp = val.ComponentList;
					}

					// Abort if the entity already has a component of this type
					if (comp in ent) {
						return;
					}

					// Create the component on the entity, add it to the explorer
					ent[comp] = {};
					self.view.explorer.scenes.addItem(
						self.selection.scene, 
						self.selection.entity, 
						'component',
						comp, 
						{}
					);

					// Add the component to the scene view, and update the properties view to show the new component
					self.view.main.scene.addComponent(self.selection.scene, self.selection.entity, comp);
					self.view.main.properties.setData(ent);
					self.modified();
				}
			});
		}
		else if (action == 'delete') {
			// Delete the selected entity from the selected scene
			// Make sure the user really wants to do this
			this.view.showModalInput({
				title: 'Delete ' + this.selection.entity + '?',
				callback: function(val) {
					// Delete the entity from the gamedata
					delete self.gamedata.scenes[self.selection.scene].entities[self.selection.entity];

					// Remove it from the editor views
					self.view.explorer.scenes.removeItem('entity', self.selection.scene, self.selection.entity);
					self.view.main.scene.removeEntity(self.selection.scene, self.selection.entity);

					// Deselect it
					self.selectEntity(null);

					// Save changes
					self.modified();
				}
			});
		}
		else if (action == 'duplicate') {
			// Duplicate an entity
			var self = this;
			this.view.showModalInput({
				title: 'Duplicate Entity',
				inputs: {ID: {type: 'text', value: ''}},
				callback: function(val) {
					var ID = val.ID.trim();
					if (ID == '') return;

					var sc = self.gamedata.scenes[self.selection.scene];
					var ent = sc.entities[self.selection.entity];
					// Create a deep copy of the ent from the gamedata
					var cpy = $.extend(true, {}, ent);
					
					// Store it in the gamedata with the user's specified ID
					sc.entities[ID] = cpy;

					// Add it to the scene and explorer views
					self.view.main.scene.addEntity(self.selection.scene, ID, cpy);
					self.view.explorer.scenes.addItem(self.selection.scene, null, 'entity', ID, cpy || {});

					// Save the duplicated entity
					self.modified();
				}
			});
		}
	}
	else if (type == 'component') {
		if (action == 'delete') {
			// Delete a component from the selected entity
			this.view.showModalInput({
				title: 'Delete ' + this.selection.component + '?',
				callback: function(val) {
					// Remove it from the gamedata
					delete self.gamedata.scenes[self.selection.scene].
						entities[self.selection.entity]
						[self.selection.component];

					// Update the properties view
					self.view.main.properties.setData(
						self.gamedata.scenes
							[self.selection.scene].
							entities[self.selection.entity]
					);

					// Remove the component from the explorer
					self.view.explorer.scenes.removeItem('component', 
						self.selection.scene, 
						self.selection.entity, 
						self.selection.component);

					// Delete he component off of the entity in the scene view
					self.view.main.scene.removeComponent(
						self.selection.scene, 
						self.selection.entity, 
						self.selection.component);

					// Deselect the component and save changes
					self.selectComponent(null);
					self.modified();
				}
			});
		}
	}
}

Editor.onPropertyChanged = function(comid, prop, val, updateProperties) {
	/* When a property of a component on the selected entity is changed, this is called
	 Updates the gamedata and sceneview accordingly
	 Updates the properties view if updateProperties is true.
	*/

	if (!this.selection.entity) return;
	var sc = this.gamedata.scenes[this.selection.scene];
	var ent = sc.entities[this.selection.entity];
	if (sc && ent) {
		ent[comid][prop] = val;

		this.view.main.scene.updateProperty(
			this.selection.scene,
			this.selection.entity,
			comid, ent[comid]
		);

		if (updateProperties) {
			this.view.main.properties.setData(
				this.gamedata.scenes[this.selection.scene].entities[this.selection.entity]
			);
		}
	}

	// Save changes to the gamedata
	this.modified();
}
