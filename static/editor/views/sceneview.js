SceneView = function() {
	this.$el = $('<div>', {id:'scene'});

	// Create renderer
	this.renderer = new THREE.WebGLRenderer({antialias: true});
	this.renderer.setClearColor(0xE0E0E0);
	this.renderer.shadowMapEnabled = true;

	this.camera = new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000);
	this.camera.position.set(0, -100, 40);
	this.camera.quaternion.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI/2.5);

	this.selectionMesh = new THREE.Mesh(
		new THREE.BoxGeometry(1, 1, 1),
		new THREE.MeshBasicMaterial({wireframe: true})
	);

	this.selection = null;

	var self = this;
	window.addEventListener('resize', function(e) {
		self.updateCamera();
	});

	requestAnimationFrame(this.update.bind(this));
}

SceneView.prototype.setData = function(d) {
	this.game = Game.load(d);
}

SceneView.prototype.setActiveScene = function(sid) {
	var old = Game.getActiveScene();
	if (old) {
		old.threeobj.remove(this.selectionMesh);
	}
	this.game[sid].activate();
	this.game[sid].threeobj.add(this.selectionMesh);

	this.setSelection(null);
}

SceneView.prototype.setSelection = function(eid) {
	var sc = Game.getActiveScene();
	if (eid && sc) {
		var ent = sc.entities[eid];
		if (ent) {
			this.selection = ent;
			this.selectionMesh.visible = true;
			return;
		}
	}

	this.selectionMesh.visible = false;
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

	if (this.selection) {
		if (this.selection.has('transform')) {
			var t = this.selection.get('transform');
			this.selectionMesh.position.copy(
				t.getPosition()
			);
			this.selectionMesh.quaternion.copy(
				t.getRotation()
			);
			this.selectionMesh.scale.copy(
				t.getScale()
			);
			this.selectionMesh.scale.add(
				new Vector3(1, 1, 1)
			);
		}
		else {
			this.selectionMesh.position.set(0, 0, 0);
			this.selectionMesh.quaternion.set(0, 0, 0, 1);
			this.selectionMesh.scale.set(1, 1, 1);
		}
	}

	for (var entid in sc.entities) {
		var ent = sc.entities[entid];
		var comps = ent.components();

		for (c in comps) {
			var com = comps[c];
			if (c !== 'transform' && 'threeobj' in com) {
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
