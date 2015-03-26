ScriptView = function(filename) {
	this.filename = filename;
	this.$el = $('<div>', {class:'script'});

	// Initialise the Ace editor
	this.ace = ace.edit(this.$el.get(0));
	this.ace.$blockScrolling = Infinity;

	// Set mode to JavaScript for syntactic and error highlighting
	this.ace.getSession().setMode('ace/mode/javascript');

	// Add an event to trigger an automatic save whenever the script is edited
	var self = this;
	this.ace.on('change', function() {
		// If the timer has already been started, reset it
		if (self.timeout) clearTimeout(self.timeout);
		self.timeout = setTimeout(self.autoSave.bind(self), 4000);
	});
}

ScriptView.prototype.autoSave = function() {
	// Clear the timer if necessary
	if (self.timeout) clearTimeout(self.timeout);
	// Tell the editor to save this file.
	Editor.saveScript(this.filename);
}

ScriptView.prototype.setData = function(d) {
	// Set the data in the ace editor. This is done through the Editor object
	//  when a file is loaded with AJAX.
	this.ace.setValue(d);
	this.ace.clearSelection();
	clearTimeout(this.timeout)
}

ScriptView.prototype.getData = function() {
	return this.ace.getValue();
}

ScriptView.prototype.render = function() {
	return this.$el;
}
