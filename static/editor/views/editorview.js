EditorView = function() {
	this.$el = $('<div>', {id: 'editor'});
	$('body').append(this.$el);

	// Set up views
	this.explorer = new ExplorerView();
	this.main = new MainView();
}

EditorView.prototype.render = function() {
	this.$el.empty();

	this.$el.append(this.main.render());
	this.$el.append(this.explorer.render());

	return this.$el;
}
