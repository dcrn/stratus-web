/*
 The properties view displays all of the inputs for modifying the properties
 on a component in the editor. Handlebars.js is used to render each input
 by specifying the components, their types and values.
*/

PropertiesView = function() {
	// Create a div element
	this.$el = $('<div>', {id:'properties'});

	// Compile the handlebars template
	this.template = Handlebars.compile(
		$('#template_propertiesview').html()
	);

	this.info = null;
}

PropertiesView.prototype.setData = function(d) {
	// Set the properties display by passing in data about an entity

	if (d) {
		// Get the list of components and sort it
		var coms = Object.keys(d);
		coms.sort();

		this.info = {}
		var comid, i;

		// Loop through each component on the entity
		for (i in coms) {
			comid = coms[i];
			
			this.info[comid] = {};

			// Get the current options for the component, with any defaults that weren't specified
			var options = Components.getDefaults(
				comid, 
				d[comid],
				true
			);

			// Loop through each property in the component
			var props = Components.getProperties(comid);
			var val, type;
			for (p in props) {
				val = options[p];
				type = props[p].type;

				if (type =='quaternion') {
					// Convert quaternion values into euler angles which are easier to understand
					e = new THREE.Euler();
					e.setFromQuaternion(new THREE.Quaternion(val[0], val[1], val[2], val[3]), 'ZYX');
					val = [e.x, e.y, e.z];
				}
				if (type == 'colour') {
					// Separate colour values into r, g, b components
					val = [val >> 16 & 0xFF, val >> 8 & 0xFF, val & 0xFF];
				}

				// Output the property type and converted value to the info object
				this.info[comid][p] = {
					type: type,
					value: val
				};
			}
		}
	}
	else {
		this.info = null;
	}

	// Render to update any changes to the view
	this.render();
}

PropertiesView.prototype.togglewell = function(e) {
	// Toggle a component's properties visibility
	var $span = $(this).find('span');
	$span.toggleClass('glyphicon-folder-open');
	$span.toggleClass('glyphicon-folder-close');
	$(this).parent().parent().find('.form-group').toggle();
}

PropertiesView.prototype.oninput = function(e) {
	// Whenever an input is changed in the properties interface
	e.preventDefault();
	e.stopPropagation();

	var $group = $(this).parent();
	var comid = $group.data('component');
	var prop = $group.data('property');
	var type = $group.data('type');
	var val = null;

	if (type == 'bool')
		val = $(this).prop('checked');
	else if (type == 'number' || type == 'scalar')
		val = Number.parseFloat($(this).val());
	else if (type == 'list' || type == 'text')
		val = $(this).val();
	else if (type == 'vector' || type == 'quaternion') {
		var x = Number.parseFloat($group.find('[data-axis=x]').val());
		var y = Number.parseFloat($group.find('[data-axis=y]').val());
		var z = Number.parseFloat($group.find('[data-axis=z]').val());
		if (type == 'vector')
			val = {type: type, parameters: [x, y, z]};
		else if (type == 'quaternion') {
			// Convert the euler angles back to a quaternion
			var q = new THREE.Quaternion();
			var e = new THREE.Euler(x, y, z, 'ZYX');
			q.setFromEuler(e);

			val = {type: type, parameters: [q.x, q.y, q.z, q.w]};
		}
	}
	else if (type == 'colour') {
		// Convert the colour values back to a single RGB value.
		var r = Number.parseFloat($group.find('[data-axis=r]').val());
		var g = Number.parseFloat($group.find('[data-axis=g]').val());
		var b = Number.parseFloat($group.find('[data-axis=b]').val());
		var c = r << 16 | g << 8 | b;

		val = c;
	}

	if (val !== null) {
		// Update the editor's gamedata
		Editor.onPropertyChanged(comid, prop, val);
	}
}

PropertiesView.prototype.render = function() {
	// Clear the container
	this.$el.empty();

	// Render the Handlebars template and append it to the element
	this.$el.append(this.template(this.info));

	// Add click and input events to the template
	this.$el.find('button.toggle').click(this.togglewell);
	this.$el.find('input, select').on('input', this.oninput);
	this.$el.find('input[type=checkbox]').on('change', this.oninput);

	return this.$el;
}