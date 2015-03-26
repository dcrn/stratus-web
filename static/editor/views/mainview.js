/*
	The MainView is a container for a tab view, which holds the
	{SceneView, PropertiesView} and any ScriptViews.
*/

MainView = function() {
	this.$el = $('<div>', {id: 'main'});
	
	// Create the tab view for making tabs
	this.tabs = new TabView();

	// Create a container view that holds the sceneview and properties view.
	// This allows both views to be in a single tab item.
	this.container = new ContainerView();
	this.properties = new PropertiesView();
	this.scene = new SceneView();

	// Add the properties and scene views into the container
	this.container.add(this.scene);
	this.container.add(this.properties);
	
	// Add the container as a tab to the tabview, with the title 'Scene'.
	this.tabs.add(this.container, {
		title: 'Scene'
	});
}

MainView.prototype.add = function(v, options) {
	// Add a new tab
	this.tabs.add(v, options);
}

MainView.prototype.render = function() {
	// Clear, render and append the tabview
	this.$el.empty();
	this.$el.append(this.tabs.render());

	return this.$el;
}
