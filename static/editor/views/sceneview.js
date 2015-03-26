/*
 The SceneView implements the Game Engine into the editor and
 displays a view of the scene that is currently being edited.
 The user can move around the scene while editing by clicking 
 and dragging their mouse to rotate the camera, and pressing 
 the WASD keys to move.
*/

SceneView = function() {
	var self = this;
	this.$el = $('<div>', {id:'scene'});

	// Create renderer
	this.renderer = new THREE.WebGLRenderer({antialias: true});
	this.renderer.setClearColor(0xE0E0E0);
	this.renderer.shadowMapEnabled = true;

	// Create the SceneView camera
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
	// Listen for key release events to stop moving

	ch = String.fromCharCode(e.keyCode);
	if (ch == 'W' || ch == 'S')
		this.move_forward = 0;
	else if (ch == 'D' || ch == 'A')
		this.move_right = 0;
	else if (ch == ' ' || e.keyCode == 16)
		this.move_up = 0;
}

SceneView.prototype.onKeyDown = function(e) {
	// Listen for key events to allow movement via WASD
	// Ignore repeated key events
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

	// Apply movement while the user has their mouse down on the scene
	
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
	e.offsetX = e.offsetX || e.layerX;
	e.offsetY = e.offsetY || e.layerY;
	window.getSelection().removeAllRanges();

	// Check to see if the user clicked on a handle in the selection object
	var handled = this.selection.onMouseDown(e.offsetX, e.offsetY);
	if (handled) return;

	// Else the user is looking around 
	this.looking = new THREE.Vector2(e.offsetX, e.offsetY);
}

SceneView.prototype.onMouseUp = function(e) {
	// Stop moving an object or looking
	this.selection.onMouseUp();
	this.looking = false;
}

SceneView.prototype.onMouseMove = function(e) {
	e.offsetX = e.offsetX || e.layerX;
	e.offsetY = e.offsetY || e.layerY;
	// Update the selection object if a handle is being held onto
	this.selection.onMouseMove(e.offsetX, e.offsetY);

	if (this.looking) {
		// Look around the scene by applying the mouse movement 
		// 	to the angle of the camera.

		var pos = new THREE.Vector2(e.offsetX, e.offsetY);
		var delta = pos.clone();
			delta.sub(this.looking);

		this.viewyaw -= delta.x / 300;
		// Clamp so the view can't go further than straight up or straight down
		this.viewpitch = Math.min(Math.PI, Math.max(this.viewpitch - delta.y / 300, 0));

		this.yaw.setFromAxisAngle(new Vector3(0, 0, 1), this.viewyaw);
		this.pitch.setFromAxisAngle(new Vector3(1, 0, 0), this.viewpitch);
		this.camera.quaternion.copy(this.yaw);
		this.camera.quaternion.multiply(this.pitch);

		this.looking = pos;
	}
}

SceneView.prototype.setData = function(d) {
	// Load the scene data using Game.load
	this.game = Game.load(d);

	// Activate the default scene if it's available
	if (d.config && d.config.defaultSceneID && d.config.defaultSceneID in this.game) {
		this.game[d.config.defaultSceneID].activate();
	}
	// Set the clear colour on the renderer if it has been set in the game config
	if (d.config && typeof d.config.clearColour != undefined) {
		this.renderer.setClearColor(d.config.clearColour);
	}
}

SceneView.prototype.setActiveScene = function(sid) {
	// Change the currently active scene by calling scene.activate()
	// The selection object's mesh must be added to the active scene for it to be visible

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
	else {
		Game.setActiveScene(null);
	}

	this.setSelection(null);
}

SceneView.prototype.setSelection = function(eid) {
	// Change the currently selected entity on the selection object.

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

SceneView.prototype.addScene = function(sid, data) {
	// Add an empty scene or load a scene from the specified data.

	if (data) {
		this.game[sid] = Game.loadScene(data);
	}
	else {
		this.game[sid] = new Scene();
	}
}

SceneView.prototype.addEntity = function(sid, entid, data) {
	// Add an empty entity or load an entity from the specified data.

	var sc = this.game[sid];
	if (!sc) return;
	if (data) {
		sc.add(entid, Game.loadEntity(data));
	}
	else {
		sc.add(entid, new Entity());
	}
}

SceneView.prototype.addComponent = function(sid, entid, comid) {
	// Add a component to the specified entity.

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
	// Update the clearColour of the renderer
	// Called when the game settings have been modified.

	if (typeof settings.clearColour != 'undefined') {
		this.renderer.setClearColor(settings.clearColour);
	}
}

SceneView.prototype.updateProperty = function(sid, entid, comid, options) {
	// Update the properties on a component in the scene

	var sc = this.game[sid];
	if (!sc) return;
	var ent = sc.entities[entid];
	if (!ent || !ent.has(comid)) return;

	Components.applyOptions(comid, ent.get(comid), options);

	// Update the entity with a deltatime of 0
	ent.update(0);
}

SceneView.prototype.updateCamera = function() {
	// Update the projection matrix on the camera by calculating the aspect ratio
	// 	with the width and height of the SceneView element.
	var w = this.$el.width();
	var h = this.$el.height();

	this.renderer.setSize(w, h);
	this.camera.aspect = w / h;
	this.camera.updateProjectionMatrix();
}

SceneView.prototype.render = function() {
	// Render the SceneView element by appending the canvas to it and
	//	 updating the aspect ratio on the camera.

	this.$el.empty();
	this.$el.append(this.renderer.domElement);
	this.updateCamera();

	return this.$el;
}

SceneView.prototype.update = function() {
	// Request the next animation frame to call this function again
	requestAnimationFrame(this.update.bind(this));
	if (!this.game) return;

	var sc = Game.getActiveScene();
	if (!sc) return;

	// Update the selection object
	this.selection.update();

	// Perform any movement
	this.updateMovement();

	// Loop through each entity in the active scene
	for (var entid in sc.entities) {
		var ent = sc.entities[entid];
		var comps = ent.components();

		// For each component in the entity, manually update three.js objects to
		// 	match the position, rotation and scale of the transform component.
		// This is necessary since the entities aren't updated like normal in the editor.
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

	// Render the active scene using the SceneView's camera.
	this.renderer.render(
		sc.threeobj, 
		this.camera
	);
}
