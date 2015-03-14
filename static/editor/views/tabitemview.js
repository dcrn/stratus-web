TabItemView = function(options) {
	this.template = Handlebars.compile(
		$('#template_tabitemview').html()
	);
	this.$el = $(this.template(options));

	if (options.tooltip) {
		this.$el.find('button').tooltip({container: 'body'});
	}
}

TabItemView.prototype.show = function() {
	this.$el.find('a').tab('show');
}

TabItemView.prototype.addCallback = function(cb) {
	this.$el.find('button').click(cb)
}

TabItemView.prototype.render = function() {
	return this.$el;
}
