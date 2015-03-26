/*
 The Explorer View contains a tab view, adding in it's own 
 ExplorerScenesView and ExplorerScriptsView to them accordingly.
 
*/

ExplorerView = function() {
	this.$el = $('<div>', {id: 'explorer'});

	this.scenes = new ExplorerScenesView();
	this.scripts = new ExplorerScriptsView();
	
	// Create a new tabview, with a settings button in the top-right.
	this.tabs = new TabView({
		button: 'cog', 
		tooltip: 'Settings',
		callback: function() {Editor.openSettings();}
	});

	// Add the Scenes tab, with a button that allows a new scene to be created
	this.tabs.add(this.scenes, {
		title: 'Scenes',
		button: 'plus',
		tooltip: 'New Scene',
		callback: function(v, item, panel) {Editor.newScene();}
	});

	// Add the scripts tab, with a button that lets a new script be created.
	this.tabs.add(this.scripts, {
		title: 'Scripts',
		button: 'plus',
		tooltip: 'New Script',
		callback: function(v, item, panel) {Editor.newScript();}
	});
}

ExplorerView.prototype.render = function() {
	// Empty the div tag and render the child tab view
	this.$el.empty();
	this.$el.append(this.tabs.render())

	// Return the div.
	return this.$el;
}
