ExplorerScriptsItemView = function(options) {
	this.options = options || {};
	
	this.template = Handlebars.compile(
		$('#template_explorerscriptsitemview').html()
	);
	
	this.$el = $(this.template(this.options));
	this.$el.find('button').tooltip({container: 'body'});
	this.$el.find('button').click(this.action);
	this.$el.click(this.click);
}

ExplorerScriptsItemView.prototype.click = function(e) {
	e.preventDefault();
	e.stopPropagation();

	$(this).parent().find('.selected').toggleClass('selected');
	$(this).toggleClass('selected');
}

ExplorerScriptsItemView.prototype.action = function(e) {
	e.preventDefault();
	e.stopPropagation();

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
	return this.$el;
}
