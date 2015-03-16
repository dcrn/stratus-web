SceneView = function() {
	var self = this;
	this.$el = $('<div>', {id:'scene'});

	// Create renderer
	this.renderer = new THREE.WebGLRenderer({antialias: true});
	this.renderer.setClearColor(0xE0E0E0);
	this.renderer.shadowMapEnabled = true;

	this.camera = new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000);
	this.camera.position.set(0, -100, 40);
	this.camera.quaternion.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI/2.5);

	this.viewyaw = 0.0;
	this.viewpitch = Math.PI/2.5;
	this.yaw = new Quaternion();
	this.pitch = new Quaternion();

	this.vec_forward = new Vector3(0, 0, -1);
	this.vec_right = new Vector3(1, 0, 0);
	this.vec_up = new Vector3(0, 0, 1);
	this.move_forward = 0;
	this.move_right = 0;
	this.move_up = 0;

	// Set up selection indicator
	this.selection = new SelectionObject(this.renderer, this.camera);

	// Start listening for events
	window.addEventListener('resize', this.updateCamera.bind(this));
	this.renderer.domElement.onmousemove = this.onMouseMove.bind(this);
	this.renderer.domElement.onmousedown = this.onMouseDown.bind(this);
	this.renderer.domElement.onmouseup = this.onMouseUp.bind(this);
	window.addEventListener('mouseup', this.onMouseUp.bind(this));
	window.addEventListener('keyup', this.onKeyUp.bind(this));
	window.addEventListener('keydown', this.onKeyDown.bind(this));

	// Start drawing & updating
	requestAnimationFrame(this.update.bind(this));
}

SceneView.prototype.onKeyUp = function(e) {
	ch = String.fromCharCode(e.keyCode);
	if (ch == 'W' || ch == 'S')
		this.move_forward = 0;
	else if (ch == 'D' || ch == 'A')
		this.move_right = 0;
	else if (ch == ' ' || e.keyCode == 16)
		this.move_up = 0;
}

SceneView.prototype.onKeyDown = function(e) {
	if (e.repeat) return;

	ch = String.fromCharCode(e.keyCode);
	if (ch == 'W')
		this.move_forward = 1;
	else if (ch == 'S')
		this.move_forward = -1;
	else if (ch == 'D')
		this.move_right = 1;
	else if (ch == 'A')
		this.move_right = -1;
	else if (ch == ' ')
		this.move_up = 1;
	else if (e.keyCode == 16)
		this.move_up = -1;
}

SceneView.prototype.updateMovement = function() {
	if (!this.looking) return false;
	
	if (this.move_forward != 0) {
		this.camera.position.add(
			this.vec_forward.clone().
				applyQuaternion(this.camera.quaternion).
				multiplyScalar(this.move_forward)
		);
	}
	
	if (this.move_right != 0) {
		this.camera.position.add(
			this.vec_right.clone().
				applyQuaternion(this.camera.quaternion).
				multiplyScalar(this.move_right)
		);
	}
	
	if (this.move_up != 0) {
		this.camera.position.add(
			this.vec_up.clone().
				multiplyScalar(this.move_up)
		);
	}
}

SceneView.prototype.onMouseDown = function(e) {
	var handled = this.selection.onMouseDown(e.offsetX, e.offsetY);
	if (handled) return;

	this.move_forward = 0;
	this.move_right = 0;
	this.move_up = 0;
	this.looking = new THREE.Vector2(e.offsetX, e.offsetY);
}

SceneView.prototype.onMouseUp = function(e) {
	this.selection.onMouseUp();
	this.looking = false;
}

SceneView.prototype.onMouseMove = function(e) {
	this.selection.onMouseMove(e.offsetX, e.offsetY);
	if (this.looking) {
		var pos = new THREE.Vector2(e.offsetX, e.offsetY);
		var delta = pos.clone();
			delta.sub(this.looking);

		this.viewyaw -= delta.x / 300;
		this.viewpitch = Math.min(Math.PI, Math.max(this.viewpitch - delta.y / 300, 0));

		this.yaw.setFromAxisAngle(new Vector3(0, 0, 1), this.viewyaw);
		this.pitch.setFromAxisAngle(new Vector3(1, 0, 0), this.viewpitch);
		this.camera.quaternion.copy(this.yaw);
		this.camera.quaternion.multiply(this.pitch);

		this.looking = pos;
	}
}

SceneView.prototype.setData = function(d) {
	this.game = Game.load(d);
	if (d.config && d.config.defaultSceneID) {
		this.game[d.config.defaultSceneID].activate();
	}
	if (d.config && typeof d.config.clearColour != undefined) {
		this.renderer.setClearColor(d.config.clearColour);
	}
}

SceneView.prototype.setActiveScene = function(sid) {
	var old = Game.getActiveScene();
	if (old) {
		old.threeobj.remove(this.selection.getMesh());
	}

	var sc = this.game[sid];
	if (sc) {
		sc.activate();
		sc.threeobj.add(this.selection.getMesh());
		for (var i in sc.entities) {
			sc.entities[i].update(0);
		}
	}

	this.setSelection(null);
}

SceneView.prototype.setSelection = function(eid) {
	var sc = Game.getActiveScene();
	if (eid && sc) {
		var ent = sc.entities[eid];
		if (ent) {
			this.selection.setEntity(ent);
			return;
		}
	}

	this.selection.setEntity(null);
}

SceneView.prototype.addScene = function(sid) {
	this.game[sid] = new Scene();
}

SceneView.prototype.addEntity = function(sid, entid) {
	var sc = this.game[sid];
	if (!sc) return;
	sc.add(entid, new Entity());
}

SceneView.prototype.addComponent = function(sid, entid, comid) {
	var sc = this.game[sid];
	if (!sc) return;
	var ent = sc.entities[entid];
	if (!ent) return;

	var com = Components.create(comid);
	ent.add(com);
}

SceneView.prototype.removeScene = function(sid) {
	this.setActiveScene(null);
	delete this.game[sid];
}

SceneView.prototype.removeEntity = function(sid, entid) {
	this.setSelection(null);

	var sc = this.game[sid];
	if (!sc) return;

	this.game[sid].remove(entid);
}

SceneView.prototype.removeComponent = function(sid, entid, comid) {
	var sc = this.game[sid];
	if (!sc) return;
	var ent = sc.entities[entid];
	if (!ent) return;

	var com = this.game[sid].entities[entid].get(comid);
	if (com)
		this.game[sid].entities[entid].remove(com);
}

SceneView.prototype.updateSettings = function(settings) {
	if (typeof settings.clearColour != 'undefined') {
		this.renderer.setClearColor(settings.clearColour);
	}
}

SceneView.prototype.updateProperty = function(sid, entid, comid, options) {
	var sc = this.game[sid];
	if (!sc) return;
	var ent = sc.entities[entid];
	if (!ent || !ent.has(comid)) return;

	Components.applyOptions(comid, ent.get(comid), options);
	ent.update(0);
}

SceneView.prototype.updateCamera = function() {
	var w = this.$el.width();
	var h = this.$el.height();

	this.renderer.setSize(w, h);
	this.camera.aspect = w / h;
	this.camera.updateProjectionMatrix();
}

SceneView.prototype.render = function() {
	this.$el.empty();
	this.$el.append(this.renderer.domElement);
	this.updateCamera();

	return this.$el;
}

SceneView.prototype.update = function() {
	requestAnimationFrame(this.update.bind(this));
	if (!this.game) return;

	var sc = Game.getActiveScene();
	if (!sc) return;

	this.selection.update();
	this.updateMovement();

	for (var entid in sc.entities) {
		var ent = sc.entities[entid];
		var comps = ent.components();

		for (c in comps) {
			var com = comps[c];
			if (com && c !== 'transform' && 'threeobj' in com) {
				if (ent.has('transform')) {
					var transform = ent.get('transform');
					com.threeobj.position.copy(transform.getPosition());
					com.threeobj.quaternion.copy(transform.getRotation());
					com.threeobj.scale.copy(transform.getScale());
				}
			}
		}
	}

	this.renderer.render(
		sc.threeobj, 
		this.camera
	);
}
