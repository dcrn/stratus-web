ScriptView = function(filename) {
	this.filename = filename;
	this.$el = $('<div>', {class:'script'});
	this.ace = ace.edit(this.$el.get(0));
}

ScriptView.prototype.setData = function(d) {
	this.ace.setValue(d);
}

ScriptView.prototype.getData = function() {
	return this.ace.getValue();
}

ScriptView.prototype.render = function() {
	return this.$el;
}
