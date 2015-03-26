/*
 An item in the scenes tab of the explorer.
 Each item can have it's own list, creating a tree structure.
*/

ExplorerScenesItemView = function(options) {
	this.id = options.id;
	this.type = options.type;
	this.options = options || {};

	// Compile the handlebars template for use in the render method
	this.template = Handlebars.compile(
		$('#template_explorerscenesitemview').html()
	);

	this.listview = options.listview;
}

ExplorerScenesItemView.prototype.click = function(e) {
	e.stopPropagation();
	e.preventDefault();

	// Click the parent element if it's the same class - this means when
	// an entity is selected, so is the scene that contains it.
	if ($(this).parent().hasClass('expl')) 
		$(this).parent().click();

	// Unselect all the other objects in the parent
	$(this).parent().find('.selected').toggleClass('selected');

	// Select this item
	$(this).toggleClass('selected');

	var type = $(this).data('type')
	var id = $(this).data('id')

	// Tell the editor to select the appropriate scene/entity/component.
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

ExplorerScenesItemView.prototype.action = function($button) {
	// When a button is pressed here, tell the Editor to perform that action.

	var act = $button.data('action');
	var type = this.type;
	Editor.performAction(type, act);
}

ExplorerScenesItemView.prototype.render = function() {
	// Render the template
	this.$el = $(this.template(this.options));

	// If there's a listview, then render it and add it to the element
	if (this.listview) {
		var $list = this.listview.render();

		// Add event handling for the folder icons, which will toggle the visibility of the listview.
		this.$el.find('button.toggle').click(function(e) {
			e.stopPropagation();
			e.preventDefault();
			var $span = $(this).find('span');
			$span.toggleClass('glyphicon-folder-open');
			$span.toggleClass('glyphicon-folder-close');
			$list.toggle();
		});

		// If this item is an entity, start with the listview toggled off; hiding the list of components.
		if (this.type == 'entity') {
			this.$el.find('button.toggle').click();
			$list.toggle(false);
		}

		this.$el.append($list);
	}

	// Enable the Bootstrap tooltips on the buttons
	this.$el.find('> button').tooltip({container: 'body'});

	// Add event handlers to the element, for selection and actions.
	var self = this;
	this.$el.click(this.click);
	this.$el.find('> button:not(.toggle)').click(function(e) {
		e.stopPropagation();
		e.preventDefault();
		self.action($(this));
	});

	return this.$el;
}
