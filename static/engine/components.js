/*
 Handles the registration, properties and creation of components
*/

var Components = {
	comps: {},
	properties: {}
};

Components.register = function(id, obj, props) {
	if (!id || !obj) return false;

	// Add a component with the specified ID and class
	this.comps[id] = obj;
	this.properties[id] = props || {};

	obj.prototype.id = id;
}

Components.create = function(id, options) {
	// Create a component of this type, passing in the properties for it
	// Uses the default values if any options are missing
	if (id in this.comps) {
		return new this.comps[id](
			this.getDefaults(id, options)
		);
	}

	return false;
}

Components.getDefaults = function(id, options, notranslate) {
	// Get the default values for each property of this component type

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
	// Apply options to the component if it has an applyOptions method
	options = options || {};
	if ('applyOptions' in comobj)
		comobj.applyOptions(
			Components.getDefaults(comid, options)
		);
}

Components.components = function() {
	// Return the object containing the components by ID
	return this.comps;
}

Components.list = function() {
	// Return an array of component IDs
	return Object.keys(this.comps);
}

Components.getProperties = function(id) {
	// Get the properties for a component
	return this.properties[id];
}