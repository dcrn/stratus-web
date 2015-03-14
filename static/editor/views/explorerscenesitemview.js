ExplorerScenesItemView = function(options) {
	this.options = options || {};

	this.template = Handlebars.compile(
		$('#template_explorerscenesitemview').html()
	);

	this.listview = options.listview;
}

ExplorerScenesItemView.prototype.click = function(e) {
	e.stopPropagation();
	e.preventDefault();

	if ($(this).parent().hasClass('expl')) 
		$(this).parent().click();

	$(this).parent().find('.selected').toggleClass('selected');
	$(this).toggleClass('selected');

	var type = $(this).data('type')
	var id = $(this).data('id')

	if (type == 'scene') {
		Editor.selectScene(id);
	}
	else if (type == 'entity') {
		Editor.selectEntity(id);
	}
	else if (type == 'component') {
		Editor.selectComponent(id);
	}
}

ExplorerScenesItemView.prototype.action = function(e) {
	e.stopPropagation();
	e.preventDefault();

	console.log('Not Implemented');
}

ExplorerScenesItemView.prototype.render = function() {
	this.$el = $(this.template(this.options));

	if (this.listview) {
		var $list = this.listview.render();

		this.$el.find('button.toggle').click(function() {
			var $span = $(this).find('span');
			$span.toggleClass('glyphicon-folder-open');
			$span.toggleClass('glyphicon-folder-close');
			$list.toggle();
		});

		this.$el.append($list);
	}

	this.$el.click(this.click);
	this.$el.find('> button').tooltip({container: 'body'});
	this.$el.find('> button:not(.toggle)').click(this.action);

	return this.$el;
}
