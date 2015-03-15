EditorView = function() {
	this.$el = $('<div>', {id: 'editor'});
	$('body').append(this.$el);

	// Set up views
	this.explorer = new ExplorerView();
	this.main = new MainView();
}

EditorView.prototype.showModalInput = function(opt) {
	var v = new ModalInputView(opt);
	v.show();
}

EditorView.prototype.showSettingsModal = function(data, callback) {
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
	this.$el.empty();

	this.$el.append(this.main.render());
	this.$el.append(this.explorer.render());

	return this.$el;
}
