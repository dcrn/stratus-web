SelectionObject = function(renderer, cam) {
	this.renderer = renderer;
	this.camera = cam;
	this.ray = new THREE.Raycaster();

	this.mesh = new THREE.Mesh(
		new THREE.BoxGeometry(1, 1, 1),
		new THREE.MeshBasicMaterial({wireframe: true})
	);
	this.mesh.visible = false;

	this.selectedHandle = null;
	this.handles = [];
	this.planes = [];

	var handlemesh = new THREE.IcosahedronGeometry(0.15);
	var zero = new Vector3();
	var colours = [0xFF0000, 0x00FF00, 0x0000FF];

	var self = this;
	var axes = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];
	var planeaxes = [new Vector3(0, 1, 0), new Vector3(1, 0, 0)];

	$.each(planeaxes, function(i, v) {
		self.planes[i] = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(1000, 1000),
			new THREE.MeshBasicMaterial({side: THREE.DoubleSide})
		);
		self.planes[i].quaternion.setFromUnitVectors(axes[2], planeaxes[i]);
		self.planes[i].visible = false;
		self.mesh.add(self.planes[i]);
	});

	$.each(axes, function(i, v) {
		var g = new THREE.Geometry();
		g.vertices.push(zero, v);

		self.handles[i] = new THREE.Mesh(
			handlemesh,
			new THREE.MeshBasicMaterial({color: colours[i]})
		);
		self.handles[i].position.add(v);

		self.mesh.add(self.handles[i]);
		self.mesh.add(new THREE.Line(
			g, 
			new THREE.LineBasicMaterial({color: colours[i]})
		));
	});
}

SelectionObject.prototype.getMesh = function() {
	return this.mesh
}

SelectionObject.prototype.setEntity = function(e) {
	if (!e || !e.has('transform')) {
		this.entity = null;
		this.mesh.visible = false;
	}
	else {
		this.entity = e;
	}
}

SelectionObject.prototype.onMouseDown = function(x, y) {
	if (!this.entity) return;

	var mpos = new THREE.Vector2(
		x / this.renderer.domElement.width * 2 - 1,
		y / this.renderer.domElement.height * -2 + 1
	);

	this.ray.setFromCamera(mpos, this.camera);
	
	var res = this.ray.intersectObjects(this.handles, true);
	if (res.length > 0) {
		this.selectedHandle = this.handles.indexOf(res[0].object);
		return true;
	}

	return false;
}

SelectionObject.prototype.onMouseUp = function(x, y) {
	this.selectedHandle = null;
}

SelectionObject.prototype.onMouseMove = function(x, y) {
	if (!this.entity || this.selectedHandle === null) return;
	var mpos = new THREE.Vector2(
		x / this.renderer.domElement.width * 2 - 1,
		y / this.renderer.domElement.height * -2 + 1
	);

	this.ray.setFromCamera(mpos, this.camera);

	var n = this.selectedHandle;
	var handle = this.handles[n];

	var handledir = handle.position.clone().applyQuaternion(this.mesh.quaternion);
	var offset = this.mesh.position.clone().add(
		handledir.clone().multiply(this.mesh.scale)
	);

	var dot, delta = new Vector3(0, 0, 0);
	var res = [];

	if (n < 2) {
		res = this.ray.intersectObject(this.planes[n]);
	}
	else {
		res = this.ray.intersectObjects(this.planes);
	}

	if (res.length > 0) {
		dot = handledir.dot(res[0].point.sub(offset));
		delta = handledir.clone().multiplyScalar(dot);
	}


	var t = this.entity.get('transform');
	var pos = t.getPosition();
	pos.add(delta);
	
	Editor.onPropertyChanged('transform', 'position', {
		type: 'vector', parameters: [pos.x, pos.y, pos.z]
	}, true);
}

SelectionObject.prototype.update = function() {
	if (this.entity) {
		if (this.entity.has('transform')) {
			this.mesh.visible = true;

			var t = this.entity.get('transform');
			this.mesh.position.copy(t.getPosition());
			this.mesh.quaternion.copy(t.getRotation());
			var s = Math.max(
				Math.max.apply(null, t.getScale().toArray()),
				10
			);
			this.mesh.scale.set(s, s, s);
		}
		else {
			this.mesh.visible = false;
			this.mesh.position.set(0, 0, 0);
			this.mesh.quaternion.set(0, 0, 0, 1);
			this.mesh.scale.set(1, 1, 1);
		}
	}
}