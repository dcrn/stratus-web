var Editor = Editor || {};
Editor.init = function(gamedata, repodata) {
	this.gamedata = gamedata;
	this.repodata = repodata;
	this.selection = {};
	this.scriptviews = {};

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

Editor.changeProperty = function(comid, prop, val) {
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
	}
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
			v.remove(item, panel);
			v.render();
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