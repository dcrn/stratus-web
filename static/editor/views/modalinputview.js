ModalInputView = function(options) {
	this.options = options || {};
	this.callback = options.callback;
	this.template = Handlebars.compile(
		$('#template_modalinputview').html()
	);
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

			if (options.inputs[property].type == 'bool')
				ret[property] = $(this).find('input').prop('checked');
			else
				ret[property] = $(this).find('input').val();
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
