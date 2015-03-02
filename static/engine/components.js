var Components = Components || {
	comps: {},
	properties: {}
};

Components.register = function(id, obj, props) {
	if (!id || !obj) return false;

	this.comps[id] = obj;
	this.properties[id] = props || {};

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

Components.getProperties = function(id) {
	return this.properties[id];
}