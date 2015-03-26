/*
 The TabView combines and manages the tabitemview and tabpanelviews.
*/

TabView = function(options) {
	options = options || {};

	this.$el = $('<div>');

	// Compile the handlebars template
	this.template = Handlebars.compile(
		$('#template_tabview').html()
	);
	// Render it immediately and append it to the element.
	this.$el.append(this.template(options));

	// If a button was specified in the options, add the tooltip and callback event to them.
	if (options.button && options.callback) {
		this.$el.find('button').click(options.callback);
	}
	if (options.button && options.tooltip) {
		this.$el.find('button').tooltip({container: 'body'});
	}

	this.items = [];
	this.panels = [];
}

TabView.prototype.add = function(view, options) {
	// Add a new tab to the view, specifying the view to be displayed inside the tab,
	//	and options such as the title, button and callback on the tab item itself.

	// If there are no tabs then the new tab will become the active one.
	var active = this.items.length < 1;

	// Create a new randomly generated ID for the tab, to link the tab item and panel.
	var id = 'tab_' + Math.round(Math.random() * 100000);
	
	// Create the new tab item, with any options specified
	// The tabitem is set to target the id generated above
	var item = new TabItemView({
		active: active,
		target: id,
		title: options.title,
		button: options.button,
		tooltip: options.tooltip
	});

	// Create the panel view, which has the same ID as specified as the target above.
	var panel = new TabPanelView(view, {
		active: active,
		id: id
	});

	// Add the callback to the item if one was specified
	if (options.callback) {
		var self = this;
		item.addCallback(function (e) {
			options.callback(self, item, panel);
		});
	}

	// Append the item and panel to the array that holds them
	this.items.push(item);
	this.panels.push(panel);
	
	// Render and add the item and panels to the element
	this.$el.find('.nav.nav-tabs').append(item.render());
	this.$el.find('.tab-content').append(panel.render());
}

TabView.prototype.remove = function(item, panel) {
	// Remove the specified item and panel from the tabview element and arrays
	item.$el.remove();
	panel.$el.remove();
	this.items.splice(this.items.indexOf(item));
	this.panels.splice(this.panels.indexOf(panel));
}

TabView.prototype.findTab = function(view) {
	// Find tab with view in it
	for (var i = 0; i < this.panels.length; i++) {
		if (this.panels[i].content == view) {
			return {item: this.items[i], panel: this.panels[i]};
		}
	}
}

TabView.prototype.numTabs = function() {
	return this.items.length;
}

TabView.prototype.showTab = function(index) {
	this.items[index].show();
}

TabView.prototype.render = function() {
	// Empty out the tab containers
	this.$el.find('.nav.nav-tabs').empty();
	this.$el.find('.tab-content').empty();

	// Render and append all of the tab items and panels
	for (var i = 0; i < this.items.length; i++) {
		this.$el.find('.nav.nav-tabs').append(this.items[i].render());
		this.$el.find('.tab-content').append(this.panels[i].render());
	}

	// Return the element
	return this.$el;
}
