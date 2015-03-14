ContainerView = function() {
	this.$el = $('<div>');
	this.views = [];
}

ContainerView.prototype.add = function(v) {
	this.views.push(v);
}

ContainerView.prototype.render = function() {
	this.$el.empty();
	for (var i = 0; i < this.views.length; i++) {
		this.$el.append(
			this.views[i].render()
		);
	}
	
	return this.$el;
}