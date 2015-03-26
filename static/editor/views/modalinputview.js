/*
 The modal input view displays a modal pop-up dialog using Bootstrap.
 Inputs are specified and displayed using Handlebars.js templates
*/

ModalInputView = function(options) {
	this.options = options || {};
	this.callback = options.callback;

	// Compile the Handlebars template
	this.template = Handlebars.compile(
		$('#template_modalinputview').html()
	);

	// Convert the colour values to individual R, G, B values
	var inputs = options.inputs;
	for (var i in inputs) {
		if (inputs[i].type == 'colour') {
			inputs[i].value = [
				inputs[i].value >> 16 & 0xFF,
				inputs[i].value >> 8 & 0xFF,
				inputs[i].value & 0xFF
			];
		}
	}

	// Render the template with the converted options
	this.$el = $(this.template(options));

	// Register events for clicking okay or cancel on the modal
	var self = this;
	this.$el.find('button.cancel').click(function () {
		// Cancel button will remove the modal and take no action
		self.$el.modal('hide');
		self.$el.remove();
	});
	this.$el.find('button.okay').click(function () {
		// Okay button will convert the values back and run the callback function
		var ret = {};
		self.$el.find('.form-group').each(function(el) {
			var property = $(this).data('property');

			if (inputs[property].type === 'bool') {
				ret[property] = $(this).find('input').prop('checked');
			}
			else if (inputs[property].type === 'colour') {
				var r = Number.parseFloat($(this).find('[data-axis=r]').val());
				var g = Number.parseFloat($(this).find('[data-axis=g]').val());
				var b = Number.parseFloat($(this).find('[data-axis=b]').val());
				var c = r << 16 | g << 8 | b;
				ret[property] = c;
			}
			else {
				ret[property] = $(this).find('input, select').val();

				if ((ret[property] || '').trim() === '')
					delete ret[property];
			}
		});

		// Run the callback method
		self.callback(ret);

		// Hide and remove the modal
		self.$el.modal('hide');
		self.$el.remove();
	});
}

ModalInputView.prototype.show = function() {
	this.$el.modal('show');
}

ModalInputView.prototype.render = function() {
	return this.$el;
}
