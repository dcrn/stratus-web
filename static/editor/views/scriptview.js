ScriptView = function(filename) {
	this.filename = filename;
	this.$el = $('<div>', {class:'script'});
	this.ace = ace.edit(this.$el.get(0));
	this.ace.$blockScrolling = Infinity;
	this.ace.getSession().setMode('ace/mode/javascript');

	var self = this;
	this.ace.on('change', function() {
		if (self.timeout) clearTimeout(self.timeout);
		self.timeout = setTimeout(self.autoSave.bind(self), 4000);
	});
}

ScriptView.prototype.autoSave = function() {
	if (self.timeout) clearTimeout(self.timeout);
	Editor.saveScript(this.filename);
}

ScriptView.prototype.setData = function(d) {
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
