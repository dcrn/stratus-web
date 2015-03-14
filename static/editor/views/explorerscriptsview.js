ExplorerScriptsView = function() {
	this.$el = $('<ul>', {id:'scriptlist', class: 'expl'});
	this.data = null;
	this.views = [];
}

ExplorerScriptsView.prototype.setData = function(d) {
	this.data = d;
	for (var file in this.data) {
		this.views.push(
			new ExplorerScriptsItemView({
				id: file
			})
		);
	}

	this.render();
}

ExplorerScriptsView.prototype.render = function() {
	this.$el.empty();
	for (var i in this.views) {
		this.$el.append(
			this.views[i].render()
		);
	}

	return this.$el;
}
