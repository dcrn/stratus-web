TabPanelView = function(view, options) {
	this.template = Handlebars.compile(
		$('#template_tabpanelview').html()
	);
	this.$el = $(this.template(options));
	this.content = view;
}

TabPanelView.prototype.render = function() {
	this.$el.empty();
	this.$el.append(this.content.render());

	return this.$el;
}
