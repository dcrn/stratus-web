var Editor = Editor || {};
Editor.init = function(gamedata, repodata) {
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

	// Re-render scene to fix camera
	this.view.main.scene.render();

	// Events
	window.onbeforeunload = this.onClose.bind(this);
	window.addEventListener('blur', this.onBlur.bind(this));
}

Editor.selectScene = function(s) {
	this.selection.scene = s;
	delete this.selection.entity;
	delete this.selection.component;

	this.view.main.properties.setData(null);
	this.view.main.scene.setActiveScene(s);
}

Editor.selectEntity = function(e) {
	this.selection.entity = e;
	delete this.selection.component;

	this.view.main.properties.setData(
		this.gamedata.scenes[this.selection.scene].entities[e]
	);

	this.view.main.scene.setSelection(e);
}

Editor.selectComponent = function(c) {
	this.selection.component = c;
}

Editor.modified = function() {
	if (this.savetimer) 
		clearTimeout(this.savetimer);

	this.savetimer = setTimeout(this.autoSave.bind(this), 4000);
}

Editor.onClose = function() {
	if (this.savetimer) {
		clearTimeout(this.savetimer);
		this.autoSave(true);
	}
}

Editor.onBlur = function() {
	if (this.savetimer) {
		clearTimeout(this.savetimer);
		this.autoSave();
	}
}

Editor.autoSave = function(sync) {
	$.ajax({
		type:'POST', 
		async: !sync,
		data: JSON.stringify(this.gamedata, null, '\t') + '\n', 
		url: window.location.pathname + 
			'/gamedata.json'
	});
}

Editor.saveScript = function(filename) {
	if (!this.scriptviews[filename]) {
		return;
	}

	$.ajax({
		type:'POST', 
		data: this.scriptviews[filename].getData(), 
		url: window.location.pathname + 
			'/components/' + 
			filename
	});
}

Editor.editScript = function(filename) {
	if (this.scriptviews[filename]) {
		return;
	}
	var self = this;

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
	var self = this;
	this.view.showModalInput({
		title: 'Delete ' + filename + '?',
		callback: function() {
			$.ajax({
				type: 'DELETE',
				url: window.location.pathname + 
					'/components/' + filename,
				success: function() {
					delete self.repodata.components[filename];
					self.view.explorer.scripts.setData(self.repodata.components);

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
	var self = this;
	this.view.showModalInput({
		title: 'Duplicate Script',
		inputs: {filename: {type: 'text', value: ''}},
		callback: function(val) {
			var filename = val.filename.trim();
			if (filename == '') return;
			if (filename.slice(-3) !== '.js')
				filename += '.js';

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
	var self = this;
	this.view.showModalInput({
		title: 'New Script Component',
		inputs: {filename: {type: 'text', value: ''}},
		callback: function(val) {
			var filename = val.filename.trim();
			if (filename == '') return;
			if (filename.slice(-3) !== '.js')
				filename += '.js';

			$.ajax({
				type:'POST', 
				data: '', 
				url: window.location.pathname + 
					'/components/' + filename,
				success: function() {
					self.repodata.components[filename] = true;
					self.view.explorer.scripts.setData(self.repodata.components);
				}
			});
		}
	});
}

Editor.newScene = function() {
	var self = this;
	this.view.showModalInput({
		title: 'New Scene',
		inputs: {ID: {type: 'text', value: ''}},
		callback: function(val) {
			if (!val.ID) return;
			val.ID = val.ID.trim();
			if (val.ID === '') return;

			self.gamedata.scenes[val.ID] = {entities:{}};
			self.view.main.scene.addScene(val.ID);
			self.view.explorer.scenes.addItem(null, null, 'scene', val.ID, {});

			self.selectScene(val.ID);
			self.modified();
		}
	});
}

Editor.openSettings = function() {
	var self = this;
	this.view.showSettingsModal(this.gamedata.config, function(r) {
		self.gamedata.config = r;
		self.view.main.scene.updateSettings(r);
		self.modified();
	});
}

Editor.performAction = function(type, action) {
	var self = this;

	if (type == 'scene') {
		if (action == 'add') {
			var sc = this.gamedata.scenes[this.selection.scene];
			this.view.showModalInput({
				title: 'New Entity',
				inputs: {ID: {type: 'text', value: ''}},
				callback: function(val) {
					if (!val.ID) return;
					val.ID = val.ID.trim();
					if (val.ID === '') return;

					sc.entities[val.ID] = {transform:{}};
					self.view.explorer.scenes.addItem(
						self.selection.scene, 
						null, 
						'entity', 
						val.ID, 
						{}
					);
					self.view.explorer.scenes.addItem(
						self.selection.scene, val.ID, 'component', 'transform', {}
					);
					self.view.main.scene.addEntity(self.selection.scene, val.ID);
					self.view.main.scene.addComponent(self.selection.scene, val.ID, 'transform');
					self.modified();
				}
			});
		}
		else if (action == 'delete') {
			this.view.showModalInput({
				title: 'Delete ' + this.selection.scene + '?',
				callback: function(val) {
					delete self.gamedata.scenes[self.selection.scene];
					self.view.explorer.scenes.removeItem('scene', self.selection.scene);
					self.view.main.scene.removeScene(self.selection.scene);
					self.selectScene(null);
					self.modified();
				}
			});
		}
		else if (action == 'duplicate') {
			var self = this;
			this.view.showModalInput({
				title: 'Duplicate Script',
				inputs: {ID: {type: 'text', value: ''}},
				callback: function(val) {
					var ID = val.ID.trim();
					if (ID == '') return;

					var sc = self.gamedata.scenes[self.selection.scene];
					var cpy = $.extend(true, {}, sc);

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
			var sc = this.gamedata.scenes[this.selection.scene];
			var ent = sc.entities[this.selection.entity];

			this.view.showModalInput({
				title: 'Add Component',
				inputs: {ComponentID: {type: 'text', value: ''}, Component: {type: Components.list(), value: ''}},
				callback: function(val) {
					var comp = (val.ComponentID || '').trim();
					if (!comp) {
						comp = val.Component;
					}

					if (comp in ent) {
						console.log('Already got one');
						return;
					}

					ent[comp] = {};
					self.view.explorer.scenes.addItem(
						self.selection.scene, 
						self.selection.entity, 
						'component',
						comp, 
						{}
					);
					self.view.main.scene.addComponent(self.selection.scene, self.selection.entity, comp);
					self.view.main.properties.setData(ent);
					self.modified();
				}
			});
		}
		else if (action == 'delete') {
			this.view.showModalInput({
				title: 'Delete ' + this.selection.entity + '?',
				callback: function(val) {
					delete self.gamedata.scenes[self.selection.scene].entities[self.selection.entity];
					self.view.explorer.scenes.removeItem('entity', self.selection.scene, self.selection.entity);
					self.view.main.scene.removeEntity(self.selection.scene, self.selection.entity);
					self.selectEntity(null);
					self.modified();
				}
			});
		}
		else if (action == 'duplicate') {
			var self = this;
			this.view.showModalInput({
				title: 'Duplicate Entity',
				inputs: {ID: {type: 'text', value: ''}},
				callback: function(val) {
					var ID = val.ID.trim();
					if (ID == '') return;

					var sc = self.gamedata.scenes[self.selection.scene];
					var ent = sc.entities[self.selection.entity];
					var cpy = $.extend(true, {}, ent);
					
					sc.entities[ID] = cpy;
					self.view.main.scene.addEntity(self.selection.scene, ID, cpy);
					self.view.explorer.scenes.addItem(self.selection.scene, null, 'entity', ID, cpy || {});

					self.modified();
				}
			});
		}
	}
	else if (type == 'component') {
		if (action == 'delete') {
			this.view.showModalInput({
				title: 'Delete ' + this.selection.component + '?',
				callback: function(val) {
					delete self.gamedata.scenes[self.selection.scene].
						entities[self.selection.entity]
						[self.selection.component];

					self.view.main.properties.setData(
						self.gamedata.scenes
							[self.selection.scene].
							entities[self.selection.entity]
					);

					self.view.explorer.scenes.removeItem('component', 
						self.selection.scene, 
						self.selection.entity, 
						self.selection.component);

					self.view.main.scene.removeComponent(
						self.selection.scene, 
						self.selection.entity, 
						self.selection.component);

					self.selectComponent(null);
					self.modified();
				}
			});
		}
	}
}

Editor.onPropertyChanged = function(comid, prop, val, updateProperties) {
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

	this.modified();
}
