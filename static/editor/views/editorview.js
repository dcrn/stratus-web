/*
	Highest level view in the Editor. Contains an explorer and main view.
*/

EditorView = function() {
	// Create a new div element and append it to the body.
	this.$el = $('<div>', {id: 'editor'});
	$('body').append(this.$el);

	// Set up views
	this.explorer = new ExplorerView();
	this.main = new MainView();
}

EditorView.prototype.showModalInput = function(opt) {
	// Show a modal input view, with the inputs being defined by opt.
	var v = new ModalInputView(opt);
	v.show();
}

EditorView.prototype.showSettingsModal = function(data, callback) {
	// Display the settings modal, which loads options from the 
	// Game.properties setting
	data = data || {};

	var inputs = {};
	for (var i in Game.properties) {
		inputs[i] = {};
		inputs[i].type = Game.properties[i].type;
		inputs[i].value = data[i] || Game.properties[i].default;
	}

	this.showModalInput({
		title: 'Game Settings',
		inputs: inputs,
		callback: callback
	});
}

EditorView.prototype.render = function() {
	// Empty out the element
	this.$el.empty();

	// Render the main and explorer views, and append them to the element
	this.$el.append(this.main.render());
	this.$el.append(this.explorer.render());

	// Return the element
	return this.$el;
}
