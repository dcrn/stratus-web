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

	this.stats = new Stats();
	this.stats.setMode(0);
	this.stats.domElement.style.position = 'absolute';
	this.stats.domElement.style.left = '0px';
	this.stats.domElement.style.top = '0px';

	document.body.appendChild(this.stats.domElement);
}

Game.loadJSON = function(json_id) {
	var obj, scn, scid, opt, entid, ent, compid, com;
	try {
		obj = JSON.parse(document.getElementById(json_id).innerHTML);
	}
	catch (e) {
		console.log(e);
		console.log('Game data is corrupt');
		return false;
	}

	this.scenes = {};
	if (obj.scenes) {
		for (scid in obj.scenes) {
			if (obj.scenes[scid].config)
				opt = this.convertJSONProperties(
					obj.scenes[scid].config
				);
			else
				opt = {}

			scn = new Scene(opt);
			this.scenes[scid] = scn;

			// Create entities
			if (obj.scenes[scid].entities) {
				for (entid in obj.scenes[scid].entities) {
					ent = new Entity();
					ent.id = entid;

					for(compid in obj.scenes[scid].entities[entid]) {
						com = Components.create(
							compid,
							this.convertJSONProperties(
								obj.scenes[scid].entities[entid][compid]
							)
						);
						ent.add(com);
					}
					scn.add(entid, ent);
				}
			}
		}
	}

	// Global Game config
	if (obj.config) {
		var config = this.convertJSONProperties(obj.config);

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
	}
	
	if (obj.scenes) {
		if ('defaultSceneID' in config)
			this.scenes[
				config.defaultSceneID
			].activate();
		else
			this.scenes[
				Object.keys(this.scenes)[0]
			].activate();
	}
}

Game.convertJSONProperties = function(obj) {
	var v, i;
	for (i in obj) {
		v = obj[i];
		if (typeof v === 'object') {
			if (v.type === 'vector') {
				obj[i] = new Vector3(
					v.parameters[0],
					v.parameters[1],
					v.parameters[2]);
			}
			else if (v.type === 'quaternion') {
				obj[i] = new Quaternion();(
					v.parameters[0],
					v.parameters[1],
					v.parameters[2],
					v.parameters[3]);
			}
		}
	}

	return obj;
}

Game.start = function() {
	var self = this;

	this.lasttime = 0;
	function update(now) {
		requestAnimationFrame(update);
		self.stats.begin();
			var dt = (now - self.lasttime) / 1000;
			self.lasttime = now;

			if (self.activeScene)
				self.activeScene.update(dt);
		self.stats.end();

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