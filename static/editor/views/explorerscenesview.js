ExplorerScenesView = function(type) {
	this.type = type || 'scene';
	this.$el = $('<ul>', {class: 'expl'});

	this.views = [];
}

ExplorerScenesView.prototype.setData = function(d) {
	this.views = [];
	for (var id in d) {
		var v;
		if (this.type == 'scene') {
			var listview = new ExplorerScenesView('entity');
			listview.setData(d[id].entities);

			v = new ExplorerScenesItemView({
				id: id,
				type: this.type,
				listview: listview
			});
		}
		else if (this.type == 'entity') {
			var listview = new ExplorerScenesView('component');
			listview.setData(d[id]);

			v = new ExplorerScenesItemView({
				id: id,
				type: this.type,
				listview: listview
			});
		}
		else {
			v = new ExplorerScenesItemView({
				id: id,
				type: this.type
			});
		}

		this.views.push(v);
	}

	this.render();
}

ExplorerScenesView.prototype.render = function() {
	this.$el.empty();
	for (var i = 0; i < this.views.length; i++) {
		this.$el.append(this.views[i].render());
	}

	return this.$el;
}
