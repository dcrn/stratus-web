var Editor = Editor || {};

Editor.init = function() {
	this.renderer = new THREE.WebGLRenderer({antialias: true});
	$('#sceneEditor').append(this.renderer.domElement);

	this.renderer.setClearColor(0xE0E0E0);

	this.camera = new THREE.PerspectiveCamera(75, 0, 0.1, 1000);
	this.camera.position.set(0, -40, 10);
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
}

Editor.invalidate = function() {
	this.paint = true;
}

Editor.start = function() {
	var self = this;
	this.invalidate();

	function update() {
		requestAnimationFrame(update);
		if (self.paint && self.activeScene) {
			self.renderer.render(
				self.activeScene, 
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

Editor.selectScene = function(s) {

}

Editor.selectEntity = function(s, e) {

}

Editor.selectComponent = function(s, e, c) {

}

Editor.updateSceneList = function() {

}

Editor.updateComponentList = function() {

}

Editor.updatePropertiesList = function() {

}
