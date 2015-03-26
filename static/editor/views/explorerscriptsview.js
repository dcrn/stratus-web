/*
 This view implements a list of ExplorerScriptItemViews
*/

ExplorerScriptsView = function() {
	// Create the ul element
	this.$el = $('<ul>', {id:'scriptlist', class: 'expl'});
	this.data = null;
	this.views = [];
}

ExplorerScriptsView.prototype.setData = function(d) {
	// Set the data from the file listing of the components folder
	this.data = d;
	this.views = [];
	
	// Add each file as an ExplorerScriptsItemView.
	for (var file in this.data) {
		this.views.push(
			new ExplorerScriptsItemView({
				id: file
			})
		);
	}

	// Force a render update
	this.render();
}

ExplorerScriptsView.prototype.render = function() {
	// Empty out the list
	this.$el.empty();

	// Render and add each child item view
	for (var i in this.views) {
		this.$el.append(
			this.views[i].render()
		);
	}

	return this.$el;
}
