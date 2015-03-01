var Game = Game || {
	scenes: {},
	activeCamera: null,
	activeScene: null,
	renderer: null,
	pointerlock: false
}

Vector3 = THREE.Vector3;
Quaternion = THREE.Quaternion;

Game.init = function() {
	this.renderer = new THREE.WebGLRenderer({antialias: true});
	this.renderer.setSize(window.innerWidth, window.innerHeight);
	this.aspectRatio = window.innerWidth / window.innerHeight;
	document.body.appendChild(this.renderer.domElement);
}

Game.loadScene = function(json) {
	var opt = {}, scene, ent;

	if(json.config)
		opt = this.loadOptions(json.config);

	scene = new Scene(opt);

	for (entid in json.entities) {
		ent = this.loadEntity(json.entities[entid]);

		scene.add(
			entid, 
			ent
		);
	}

	return scene;
}

Game.loadEntity = function(json) {
	var entity = new Entity(), opt, com;

	for (comid in json) {
		opt = this.loadOptions(json[comid]);
		com = Components.create(comid, opt);
		entity.add(com);
	}

	return entity;
}

Game.loadOptions = function(json) {
	var options = {}, v, i;

	for (i in json) {
		v = json[i];

		if (typeof v === 'object' && v.type === 'vector') {
			options[i] = new Vector3(
				v.parameters[0],
				v.parameters[1],
				v.parameters[2]);
		}
		else if (typeof v === 'object' && v.type === 'quaternion') {
			options[i] = new Quaternion(
				v.parameters[0],
				v.parameters[1],
				v.parameters[2],
				v.parameters[3]);
		}
		else {
			options[i] = v;
		}
	}

	return options;
}

Game.load = function(json) {
	var scn, scid, opt, entid, ent, compid, com;

	this.scenes = {};
	if (json.scenes) {
		for (scid in json.scenes) {
			this.scenes[scid] = this.loadScene(json.scenes[scid]);
		}
	}

	if (json.config) {
		var config = this.convertJSONProperties(json.config);

		if ('shadowMapEnabled' in config)
			this.setShadowMapEnabled(config.shadowMapEnabled);
		if ('shadowMapType' in config)
			this.setShadowMapType(config.shadowMapType);
		if ('shadowCameraNear' in config)
			this.setShadowCameraNear(config.shadowCameraNear);
		if ('shadowCameraFar' in config)
			this.setShadowCameraFar(config.shadowCameraFar);
		if ('shadowCameraFov' in config)
			this.setShadowCameraFov(config.shadowCameraFov);
		if ('shadowMapBias' in config)
			this.setShadowMapBias(config.shadowMapBias);
		if ('shadowMapDarkness' in config)
			this.setShadowMapDarkness(config.shadowMapDarkness);
		if ('shadowMapWidth' in config)
			this.setShadowMapWidth(config.shadowMapWidth);
		if ('shadowMapHeight' in config)
			this.setShadowMapHeight(config.shadowMapHeight);
		if ('clearColour' in config)
			this.setClearColour(config.clearColour);
		if ('pointerLockEnabled' in config)
			this.setPointerLockEnabled(config.pointerLockEnabled);
		if ('defaultSceneID' in config)
			this.scenes[config.defaultSceneID].activate();
	}

	return this.scenes;
}

Game.start = function() {
	var self = this;

	if (!this.getActiveScene()) {
		var k = Object.keys(this.scenes);
		if (k.length > 0)
			this.scenes[k[0]].activate();
	}

	this.lasttime = 0;
	function update(now) {
		requestAnimationFrame(update);
		var dt = (now - self.lasttime) / 1000;
		self.lasttime = now;

		if (self.activeScene)
			self.activeScene.update(dt);

		if (self.activeScene && self.activeCamera)
			self.renderer.render(
				self.activeScene.threeobj, 
				self.activeCamera.threeobj
			);
	}
	requestAnimationFrame(update);

	// Pointer lock
	this.renderer.domElement.addEventListener('mousedown', function(e) {
		if (self.pointerlock)
			self.pointerlock();
	});

	// Resize
	window.addEventListener('resize', function(e) {
		self.renderer.setSize(window.innerWidth, window.innerHeight);
		self.aspectRatio = window.innerWidth / window.innerHeight;

		if (self.activeCamera)
			self.activeCamera.setAspectRatio(self.aspectRatio);
	});
}

Game.getSceneByID = function(sid) {
	return this.scenes[sid];
}

Game.setActiveScene = function(s) {
	this.activeScene = s;
}

Game.getActiveScene = function(s) {
	return this.activeScene;
}

Game.setActiveCamera = function(c) {
	c.setAspectRatio(this.aspectRatio);
	this.activeCamera = c;
}

Game.getShadowMapEnabled = function() {
	return this.renderer.shadowMapEnabled
}

Game.setShadowMapEnabled = function(val) {
	this.renderer.shadowMapEnabled = val;
}

Game.getShadowMapType = function() {
	if (this.renderer.shadowMapType == THREE.PCFSoftShadowMap)
		return 'PCFSoftShadowMap';
	if (this.renderer.shadowMapType == THREE.PCFShadowMap)
		return 'PCFShadowMap';
	if (this.renderer.shadowMapType == THREE.BasicShadowMap)
		return 'BasicShadowMap';
}

Game.setShadowMapType = function(val) {
	this.renderer.shadowMapType = THREE[val];
}

Game.getShadowCameraNear = function() {
	return this.renderer.shadowCameraNear
}

Game.setShadowCameraNear = function(val) {
	this.renderer.shadowCameraNear = val;
}

Game.getShadowCameraFar = function() {
	return this.renderer.shadowCameraFar
}

Game.setShadowCameraFar = function(val) {
	this.renderer.shadowCameraFar = val;
}

Game.getShadowCameraFov = function() {
	return this.renderer.shadowCameraFov
}

Game.setShadowCameraFov = function(val) {
	this.renderer.shadowCameraFov = val;
}

Game.getShadowMapBias = function() {
	return this.renderer.shadowMapBias
}

Game.setShadowMapBias = function(val) {
	this.renderer.shadowMapBias = val;
}

Game.getShadowMapDarkness = function() {
	return this.renderer.shadowMapDarkness
}

Game.setShadowMapDarkness = function(val) {
	this.renderer.shadowMapDarkness = val;
}

Game.getShadowMapWidth = function() {
	return this.renderer.shadowMapWidth
}

Game.setShadowMapWidth = function(val) {
	this.renderer.shadowMapWidth = val;
}

Game.getShadowMapHeight = function() {
	return this.renderer.shadowMapHeight
}

Game.setShadowMapHeight = function(val) {
	this.renderer.shadowMapHeight = val;
}

Game.getClearColour = function() {
	return this.renderer.getClearColor().getHex();
}

Game.setClearColour = function(val) {
	this.renderer.setClearColor(val);
}

Game.getPointerLockEnabled = function() {
	return this.pointerlock != false;
}

Game.setPointerLockEnabled = function() {
	var can = this.renderer.domElement;
	var pl = can.requestPointerLock ||
			can.mozRequestPointerLock ||
			can.webkitRequestPointerLock;
	
	if (pl) {
		pl = pl.bind(can);
		this.pointerlock = pl;
	}
	else {
		this.pointerlock = false;
	}
}