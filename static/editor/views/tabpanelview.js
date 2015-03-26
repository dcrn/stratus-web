/*
 The TabPanelView has a view within it that is rendered when the tab is active.
*/

TabPanelView = function(view, options) {
	// Compile the handlebars template
	this.template = Handlebars.compile(
		$('#template_tabpanelview').html()
	);
	// Render the template
	this.$el = $(this.template(options));

	// Store the specified view
	this.content = view;
}

TabPanelView.prototype.render = function() {
	// Empty out the generated element
	this.$el.empty();

	// Render the content view and append it to the element
	this.$el.append(this.content.render());

	// Return the element
	return this.$el;
}
