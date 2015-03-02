var Editor = Editor || {};

Editor.init = function() {
	this.renderer = new THREE.WebGLRenderer({antialias: true});
	$('#sceneEditor').append(this.renderer.domElement);

	this.renderer.setClearColor(0xE0E0E0);

	this.camera = new THREE.PerspectiveCamera(75, 0, 0.1, 1000);
	this.camera.position.set(0, -40, 0);
	this.updateCamera();
}

Editor.updateCamera = function() {
	var w = $('#sceneEditor').width();
	var h = $('#sceneEditor').height();

	this.renderer.setSize(w, h);
	this.camera.aspect = w / h;

	this.invalidate();
}

Editor.load = function(gamedata) {
	this.gamedata = gamedata;
	this.scenes = Game.load(gamedata);

	if ('config' in gamedata && 'defaultSceneID' in gamedata.config)
		this.setActiveScene(
			this.scenes[gamedata.config.defaultSceneID]
		);
}

Editor.invalidate = function() {
	this.paint = true;
}

Editor.start = function() {
	var self = this;
	this.invalidate();
	this.updateSceneExplorer();
	this.updateComponentList();

	function update() {
		requestAnimationFrame(update);
		if (self.paint && self.activeScene) {
			self.renderer.render(
				self.activeScene.threeobj, 
				self.camera
			);
			self.paint = false;
		}
	}
	requestAnimationFrame(update);

	window.addEventListener('resize', function(e) {
		self.updateCamera();
	});
}

Editor.setActiveScene = function(s) {
	this.activeScene = s;
}

Editor.getActiveScene = function(s) {
	return this.activeScene;
}

Editor.selectScene = function(s) {

}

Editor.selectEntity = function(s, e) {

}

Editor.selectComponent = function(s, e, c) {

}

Editor.updateSceneExplorer = function() {
	var explorer = $('#explorer');
	explorer.empty();

	var source = $('#explorer_template').html();
	var temp = Handlebars.compile(source);

	var html = temp(this.gamedata);
	explorer.append(html);

	$('.explorer_item').click(this.explorerOnClick);
	$('.listtoggle').click(this.explorerOnListToggle);
}

Editor.updateComponentList = function() {

}

Editor.updatePropertiesList = function() {

}

// Events:
Editor.explorerOnClick = function(e) {
	e.preventDefault();
	e.stopPropagation();
	console.log($(this));
}

Editor.explorerOnListToggle = function(e) {
	e.preventDefault();
	e.stopPropagation();
	
	var el = $(this);
	el.parent().find('ul:first').toggle();
	var span = el.find('span:first');
	span.toggleClass('glyphicon-folder-open');
	span.toggleClass('glyphicon-folder-close');
}