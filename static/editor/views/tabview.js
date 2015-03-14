TabView = function(options) {
	options = options || {};

	this.$el = $('<div>');

	this.template = Handlebars.compile(
		$('#template_tabview').html()
	);
	this.$el.append(this.template(options));
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
	var active = this.items.length < 1;
	var id = 'tab_' + Math.round(Math.random() * 100000);
	
	var item = new TabItemView({
		active: active,
		target: id,
		title: options.title,
		button: options.button,
		tooltip: options.tooltip
	});
	var panel = new TabPanelView(view, {
		active: active,
		id: id
	});

	var self = this;
	item.addCallback(function (e) {
		options.callback(self, item, panel);
	});

	this.items.push(item);
	this.panels.push(panel);
}

TabView.prototype.remove = function(item, panel) {
	this.items.splice(this.items.indexOf(item));
	this.panels.splice(this.panels.indexOf(panel));
}

TabView.prototype.numTabs = function() {
	return this.items.length;
}

TabView.prototype.showTab = function(index) {
	this.items[index].show();
}

TabView.prototype.render = function() {
	this.$el.find('.nav.nav-tabs').empty();
	this.$el.find('.tab-content').empty();

	for (var i = 0; i < this.items.length; i++) {
		this.$el.find('.nav.nav-tabs').append(this.items[i].render());
		this.$el.find('.tab-content').append(this.panels[i].render());
	}

	return this.$el;
}
