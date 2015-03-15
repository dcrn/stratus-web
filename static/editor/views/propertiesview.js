PropertiesView = function() {
	this.$el = $('<div>', {id:'properties'});
	this.template = Handlebars.compile(
		$('#template_propertiesview').html()
	);

	this.info = null;
}

PropertiesView.prototype.setData = function(d) {
	if (d) {
		this.info = {}
		for (comid in d) {
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

				if (type == 'colour')
					val = [val >> 16 & 0xFF, val >> 8 & 0xFF, val & 0xFF];

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
			var w = Number.parseFloat($group.find('[data-axis=w]').val());
			val = {type: type, parameters: [x, y, z, w]};
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