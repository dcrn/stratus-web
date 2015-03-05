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
	if (id in this.comps) {
		return new this.comps[id](
			this.getDefaults(id, options)
		);
	}

	return false;
}

Components.getDefaults = function(id, options, notranslate) {
	options = options || {};
	var opt = {};

	// Copy defaults, translate flat vectors and quats to real ones
	for (p in this.properties[id]) {
		var type = this.properties[id][p].type;

		if (p in options) {
			if (typeof options[p] == 'object')
				opt[p] = options[p].parameters
			else
				opt[p] = options[p];
		}
		else {
			opt[p] = this.properties[id][p].default;
		}

		if (!notranslate) {
			if (type === 'vector')
				opt[p] = new Vector3(opt[p][0],
					opt[p][1],
					opt[p][2]);
			if (type === 'quaternion')
				opt[p] = new Quaternion(opt[p][0],
					opt[p][1],
					opt[p][2],
					opt[p][3]);
		}
	}

	return opt;
}

Components.applyOptions = function(comid, comobj, options) {
	options = options || {};
	if ('applyOptions' in comobj)
		comobj.applyOptions(
			Components.getDefaults(comid, options)
		);
}

Components.list = function() {
	return Object.keys(this.comps);
}

Components.getProperties = function(id) {
	return this.properties[id];
}