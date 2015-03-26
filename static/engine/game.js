/*
 The Game object is responsible for loading, initialising and starting the game
*/

var Game = Game || {
	scenes: {},
	activeCamera: null,
	activeScene: null,
	renderer: null,
	pointerlock: false
}

// Alias the most commonly used Three.js objects to a shorter version
Vector3 = THREE.Vector3;
Quaternion = THREE.Quaternion;

Game.init = function() {
	// Create a new Three.js renderer object which uses WebGL
	this.renderer = new THREE.WebGLRenderer({antialias: true});
	this.renderer.setSize(window.innerWidth, window.innerHeight);
	this.aspectRatio = window.innerWidth / window.innerHeight;
	document.body.appendChild(this.renderer.domElement);
}

Game.loadScene = function(json) {
	// Load a scene from a scene json object
	var opt = {}, scene, ent;

	// Copy config data from the object
	if(json.config) {
		for (x in json.config) {
			opt[x] = json.config[x];
		}
	}

	// Make the scene
	scene = new Scene(opt);

	// For each entity in the json object's entities entry, load that entity using Game.loadEntity.
	for (entid in json.entities) {
		ent = this.loadEntity(json.entities[entid]);

		// Add the loaded entity into the scene
		scene.add(
			entid, 
			ent
		);
	}

	return scene;
}

Game.loadEntity = function(json) {
	// Load an entity from the serialised JSON format
	var entity = new Entity(), opt, com;

	// Create each component and add it to the entity
	for (comid in json) {
		com = Components.create(comid, json[comid]);
		entity.add(com);
	}

	return entity;
}

Game.load = function(json) {
	// Load a full game from the passed in JSON
	var scn, scid, opt, entid, ent, compid, com;

	// Load each scene in the json.scenes object
	this.scenes = {};
	if (json.scenes) {
		for (scid in json.scenes) {
			this.scenes[scid] = this.loadScene(json.scenes[scid]);
		}
	}

	// Get the first scene available and activate it, to make sure there's always a starting scene
	// at the beginning of each game, even if no default scene is specified.
	var sceneids = Object.keys(this.scenes);
	if (sceneids.length > 0) {
		this.scenes[sceneids[0]].activate();
	}

	// Have config and initialized
	if (json.config && this.renderer) {
		var config = json.config;

		// Load each config setting and call the related setter on the Game object
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

		// Activate the 'defaultscene' from the config if it exists
		if ('defaultSceneID' in config && config.defaultSceneID in this.scenes)
			this.scenes[config.defaultSceneID].activate();
	}

	return this.scenes;
}

Game.start = function() {
	// Begin running the game
	var self = this;

	// If there's no active scene at this point, find one and activate it.
	if (!this.getActiveScene()) {
		var k = Object.keys(this.scenes);
		if (k.length > 0)
			this.scenes[k[0]].activate();
	}

	// Start the update method, which runs every frame
	this.lasttime = 0;
	function update(now) {
		// Make sure the next frame will call this function
		requestAnimationFrame(update);

		// Find out the time between frames
		var dt = (now - self.lasttime) / 1000;
		self.lasttime = now;

		// Update the active scene (if any)
		if (self.activeScene)
			self.activeScene.update(dt);

		// Render the active scene with the active camera on the Threejs renderer object.
		if (self.activeScene && self.activeCamera)
			self.renderer.render(
				self.activeScene.threeobj, 
				self.activeCamera.threeobj
			);
	}
	// Call the update function on the next frame
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

		// Change the camera's aspect ratio accordingly.
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
	// Set the camera's aspect ratio before activating it
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
	return this.pointerlock !== false;
}

Game.setPointerLockEnabled = function(b) {
	// Set the usage of the pointerlock API

	if (!b) {
		this.pointerlock = false;
		return;
	}

	// Get the canvas element for the renderer
	var can = this.renderer.domElement;
	// Get the pointer lock API method
	// This is different for each browser that implements it, so just try them all.
	var pl = can.requestPointerLock ||
			can.mozRequestPointerLock ||
			can.webkitRequestPointerLock;
	
	if (pl) {
		// Store the pointerlock method for when the user clicks on the game
		pl = pl.bind(can);
		this.pointerlock = pl;
	}
	else {
		this.pointerlock = false;
	}
}

// Game settings
Game.properties = {
	shadowMapEnabled: {type: 'bool', default: true},
	shadowMapType: {type: ['PCFSoftShadowMap', 'PCFShadowMap', 'BasicShadowMap'], default: 'PCFShadowMap'},
	clearColour: {type: 'colour', default: 0x000000},
	pointerLockEnabled: {type: 'bool', default: false},
	defaultSceneID: {type: 'text', default: ''}
}
