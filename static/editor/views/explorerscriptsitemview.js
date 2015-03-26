/*
 This view is a single item in the explorer's script view.
 Each item renders a handlebars template that contains the 
 	buttons for performing actions on a script
*/
ExplorerScriptsItemView = function(options) {
	this.options = options || {};
	
	// Compile the Handlebars.js template
	this.template = Handlebars.compile(
		$('#template_explorerscriptsitemview').html()
	);
	
	// Render the template and make it the $element for this view
	this.$el = $(this.template(this.options));

	// Show the Bootstrap tooltip for each button
	this.$el.find('button').tooltip({container: 'body'});
	// Add in all the required events for each button
	this.$el.find('button').click(this.action);
	this.$el.click(this.click);
}

ExplorerScriptsItemView.prototype.click = function(e) {
	e.preventDefault();
	e.stopPropagation();

	// Upon clicking, deselect all other scriptitemviews, and select this one.
	$(this).parent().find('.selected').toggleClass('selected');
	$(this).toggleClass('selected');
}

ExplorerScriptsItemView.prototype.action = function(e) {
	e.preventDefault();
	e.stopPropagation();

	// When a button is clicked, tell the Editor to perform the related action.

	var action = $(this).data('action');
	var id = $(this).parent().data('id');
	
	if (action == 'edit') {
		Editor.editScript(id);
	}
	else if (action == 'duplicate') {
		Editor.duplicateScript(id);
	}
	else if (action == 'delete') {
		Editor.deleteScript(id);
	}
}

ExplorerScriptsItemView.prototype.render = function() {
	// Return the previously rendered template
	return this.$el;
}
