PropertiesView = function() {
	this.$el = $('<div>', {id:'properties'});
	this.template = Handlebars.compile(
		$('#template_propertiesview').html()
	);

	this.info = null;
}

PropertiesView.prototype.setData = function(d) {
	if (d) {
		var coms = Object.keys(d);
		coms.sort();

		this.info = {}
		var comid, i;
		for (i in coms) {
			comid = coms[i];
			
			this.info[comid] = {};

			var options = Components.getDefaults(
				comid, 
				d[comid],
				true
			);

			var props = Components.getProperties(comid);
			var val, type;
			for (p in props) {
				val = options[p];
				type = props[p].type;

				if (type =='quaternion') {
					e = new THREE.Euler();
					e.setFromQuaternion(new THREE.Quaternion(val[0], val[1], val[2], val[3]), 'ZYX');
					val = [e.x, e.y, e.z];
				}
				if (type == 'colour') {
					val = [val >> 16 & 0xFF, val >> 8 & 0xFF, val & 0xFF];
				}

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

	this.render();
}

PropertiesView.prototype.togglewell = function(e) {
	var $span = $(this).find('span');
	$span.toggleClass('glyphicon-folder-open');
	$span.toggleClass('glyphicon-folder-close');
	$(this).parent().parent().find('.form-group').toggle();
}

PropertiesView.prototype.oninput = function(e) {
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
			var q = new THREE.Quaternion();
			var e = new THREE.Euler(x, y, z, 'ZYX');
			q.setFromEuler(e);

			val = {type: type, parameters: [q.x, q.y, q.z, q.w]};
		}
	}
	else if (type == 'colour') {
		var r = Number.parseFloat($group.find('[data-axis=r]').val());
		var g = Number.parseFloat($group.find('[data-axis=g]').val());
		var b = Number.parseFloat($group.find('[data-axis=b]').val());
		var c = r << 16 | g << 8 | b;

		val = c;
	}

	if (val !== null) {
		Editor.onPropertyChanged(comid, prop, val);
	}
}

PropertiesView.prototype.render = function() {
	this.$el.empty();
	this.$el.append(this.template(this.info));
	this.$el.find('button.toggle').click(this.togglewell);
	this.$el.find('input, select').on('input', this.oninput);
	this.$el.find('input[type=checkbox]').on('change', this.oninput);

	return this.$el;
}