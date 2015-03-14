ExplorerScenesView = function(type) {
	this.type = type || 'scene';
	this.$el = $('<ul>', {class: 'expl'});

	this.views = [];
}

ExplorerScenesView.prototype.addItem = function(scene, entity, type, id, data) {
		// addItem(null, null, 'scene', 'scene6', {entities:{}}
	if (type !== this.type) {
		for (var i = 0; i < this.views.length; i++) {
			var v = this.views[i];
			if (v.type === 'scene' && v.id === scene ||
				v.type === 'entity' && v.id === entity) {
				v.listview.addItem(scene, entity, type, id, data);
				break;
			}
		}
	}
	else {
		var lv;
		if (type === 'scene')
			lv = new ExplorerScenesView('entity');
		else if (type === 'entity')
			lv = new ExplorerScenesView('component');

		if (lv && data) {
			lv.setData(data);
		}

		var v = new ExplorerScenesItemView({
			id: id,
			type: type,
			listview: lv
		});

		this.views.push(v);
		this.$el.append(v.render());
	}
}

ExplorerScenesView.prototype.removeItem = function(type, scene, entity, component) {
	if (type !== this.type) {
		for (var i = 0; i < this.views.length; i++) {
			var v = this.views[i]
			if (v.type === 'scene' && v.id === scene ||
				v.type === 'entity' && v.id === entity) {
				v.listview.removeItem(type, scene, entity, component);
				break;
			}
		}
	}
	else {
		var x = {scene:scene, entity:entity, component:component};
		for (i = 0; i < this.views.length; i++) {
			if (this.views[i].id == x[type]) {
				this.views[i].$el.remove();
				this.views.splice(i, 1);
				break;
			}
		}
	}
}

ExplorerScenesView.prototype.setData = function(d) {
	this.views = [];
	for (var id in d) {
		var data = d[id];
		if (this.type == 'scene')
			data = d[id].entities;

		this.addItem(null, null, this.type, id, data);
	}
}

ExplorerScenesView.prototype.render = function() {
	this.$el.empty();
	for (var i = 0; i < this.views.length; i++) {
		this.$el.append(this.views[i].render());
	}

	return this.$el;
}
