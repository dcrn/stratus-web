var Components = Components || {
	comps: {}
};

Components.register = function(id, obj) {
	if (!id || !obj) return false;

	this.comps[id] = obj;
	obj.prototype.id = id;
}

Components.create = function(id, options) {
	if (id in this.comps)
		return new this.comps[id](options);

	return false;
}

Components.list = function() {
	return Object.keys(this.comps);
}