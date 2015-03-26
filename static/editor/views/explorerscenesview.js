/*
 The explorer scenes view is a list of explorerscenesitemviews,
 	each of which can have their own list embedded.
 This forms a tree representing the gamedata structure in the Editor.
*/

ExplorerScenesView = function(type) {
	this.type = type || 'scene';
	this.$el = $('<ul>', {class: 'expl'});

	this.views = [];
}

ExplorerScenesView.prototype.addItem = function(scene, entity, type, id, data) {
	// The type passed to this method determines whether the item is added here, or to a 
	// child view.

	// If this isn't the correct type, then the function call is passed down to a child.
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
		// This is the correct element to add the item to.
		var lv;

		// If the type is a scene, then create a new scenesview for entities in that scene
		if (type === 'scene')
			lv = new ExplorerScenesView('entity');
		// If the type is an entity, then create a new scenesview for the components.
		else if (type === 'entity')
			lv = new ExplorerScenesView('component');

		// Any data passed gets added into the child scenesview.
		if (lv && data) {
			lv.setData(data);
		}

		// Create the new itemview, with the child sceneview (if one is made)
		var v = new ExplorerScenesItemView({
			id: id,
			type: type,
			listview: lv
		});

		// Add the item to the views array and render it, then append it to the end of the list.
		this.views.push(v);
		this.$el.append(v.render());
	}
}

ExplorerScenesView.prototype.removeItem = function(type, scene, entity, component) {
	// Works in the same way as addItem, passing down the function call until it's on the correct sceneview.
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
		// If the correct item is found, then remove it from the views array, 
		// 	and remove the $el associated with it from the element of this view.
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
	// setData takes a gamedata structure and automatically adds all items from it into the tree.
	this.views = [];
	for (var id in d) {
		var data = d[id];
		if (this.type == 'scene')
			data = d[id].entities;

		this.addItem(null, null, this.type, id, data);
	}
}

ExplorerScenesView.prototype.render = function() {
	// Empty the ul element
	this.$el.empty();

	// Render and add each view to the ul element
	for (var i = 0; i < this.views.length; i++) {
		this.$el.append(this.views[i].render());
	}

	// Return the list element.
	return this.$el;
}
