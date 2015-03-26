/*
 The TabItemView is the tab portion of a tabview, which displays the title and a button
*/

TabItemView = function(options) {
	this.options = options || {};

	// Compile the template
	this.template = Handlebars.compile(
		$('#template_tabitemview').html()
	);
	
	// Render it using the options provided
	this.$el = $(this.template(this.options));
	this.cbs = [];
}

TabItemView.prototype.show = function() {
	// Activate the tab
	this.$el.find('a').tab('show');
}

TabItemView.prototype.addCallback = function(cb) {
	// Add a callback to the button
	this.cbs.push(cb);
}

TabItemView.prototype.render = function() {
	// Enable the tooltip on the button
	if (this.options.tooltip) {
		this.$el.find('button').tooltip({container: 'body'});
	}

	// Register the callback as an event on the button
	for (var i = 0; i < this.cbs.length; i++) {
		this.$el.find('button').click(this.cbs[i]);
	}

	// Return the tab element
	return this.$el;
}
