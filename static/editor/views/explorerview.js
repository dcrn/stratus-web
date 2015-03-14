ExplorerView = function() {
	this.$el = $('<div>', {id: 'explorer'});

	this.scenes = new ExplorerScenesView();
	this.scripts = new ExplorerScriptsView();
	this.tabs = new TabView({
		button: 'cog', 
		tooltip: 'Settings',
		callback: function() {console.log("Not implemented")}
	});

	this.tabs.add(this.scenes, {
		title: 'Scenes',
		button: 'plus',
		tooltip: 'New Scene',
		callback: function(v, item, panel) {console.log("Not implemented");}
	});

	this.tabs.add(this.scripts, {
		title: 'Scripts',
		button: 'plus',
		tooltip: 'New Script',
		callback: function(v, item, panel) {console.log("Not implemented");}
	});
}

ExplorerView.prototype.render = function() {
	this.$el.empty();
	this.$el.append(this.tabs.render())

	return this.$el;
}
