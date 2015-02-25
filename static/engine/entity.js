Entity = function() {
	this.comps = {};
}

Entity.prototype.add = function(comp) {
	this.comps[comp.id] = comp;
	this.comps[comp.id].entity = this;

	this.onComponentAdded(comp);
}

Entity.prototype.remove = function(comp) {
	delete comp.entity;
	delete this.comps[comp.id];

	this.onComponentRemoved(comp);
}

Entity.prototype.onComponentAdded = function(comp) {
	for (var id in this.comps) {
		if (this.comps[id].onComponentAdded)
			this.comps[id].onComponentAdded(this, comp);
	}

	if (this.scene)
		this.scene.onComponentAdded(this, comp);
}

Entity.prototype.onComponentRemoved = function(comp) {
	for (var id in this.comps) {
		if (this.comps[id].onComponentRemoved)
			this.comps[id].onComponentRemoved(this, comp);
	}

	if (this.scene)
		this.scene.onComponentRemoved(this, comp);
}

Entity.prototype.update = function(dt) {
	var c, com;
	for (c in this.comps) {
		com = this.comps[c];
		if (com.update)
			com.update(dt);
	}
}

Entity.prototype.components = function() {
	return this.comps;
}

Entity.prototype.has = function(compid) {
	return compid in this.comps;
}

Entity.prototype.get = function(compid) {
	return this.comps[compid];
}