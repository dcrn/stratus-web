ModalInputView = function(options) {
	this.options = options || {};
	this.callback = options.callback;
	this.template = Handlebars.compile(
		$('#template_modalinputview').html()
	);

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

	this.$el = $(this.template(options));

	var self = this;
	this.$el.find('button.cancel').click(function () {
		self.$el.modal('hide');
		self.$el.remove();
	});
	this.$el.find('button.okay').click(function () {
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

				if (ret[property].trim() === '')
					delete ret[property];
			}
		});

		self.callback(ret);
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
