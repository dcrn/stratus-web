TabItemView = function(options) {
	this.options = options || {};

	this.template = Handlebars.compile(
		$('#template_tabitemview').html()
	);
	this.$el = $(this.template(this.options));
	this.cbs = [];
}

TabItemView.prototype.show = function() {
	this.$el.find('a').tab('show');
}

TabItemView.prototype.addCallback = function(cb) {
	this.cbs.push(cb);
}

TabItemView.prototype.render = function() {
	if (this.options.tooltip) {
		this.$el.find('button').tooltip({container: 'body'});
	}
	for (var i = 0; i < this.cbs.length; i++) {
		this.$el.find('button').click(this.cbs[i]);
	}

	return this.$el;
}
