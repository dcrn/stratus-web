MainView = function() {
	this.$el = $('<div>', {id: 'main'});
	
	this.tabs = new TabView();
	this.container = new ContainerView();

	this.properties = new PropertiesView();
	this.scene = new SceneView();

	this.container.add(this.scene);
	this.container.add(this.properties);
	
	this.tabs.add(this.container, {
		title: 'Scene'
	});
}

MainView.prototype.add = function(v, options) {
	this.tabs.add(v, options);
	this.render();
}

MainView.prototype.render = function() {
	this.$el.empty();
	this.$el.append(this.tabs.render());

	return this.$el;
}
