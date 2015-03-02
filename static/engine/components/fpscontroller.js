FPSControllerComponent = function() {
	var self = this;
	this.look = new THREE.Quaternion();
	this.look.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI/2);
	this.yaw = new THREE.Quaternion(0, 1, 0, 0);
	this.pitch = new THREE.Quaternion(1, 0, 0, 0);

	this.axis_pitch = new Vector3(1, 0, 0);
	this.axis_yaw = new Vector3(0, 0, 1);
	this.vec_forward = new Vector3(0, 1, 0);
	this.vec_right = new Vector3(1, 0, 0);

	this.move_forward = 0;
	this.move_right = 0;

	this.sensitivity = -0.0035;
	this.speed = 50;

	this.mouse_x = 0;
	this.mouse_y = Math.PI/2;

	this.physics = new PhysicsComponent({
		shape: 'cylinder',
		mass: 20,
		angularDamping: 10000,
		friction: 100,
		damping: 0.0
	});

	var size = {x: 2, y:16, z: 2};
	this.physics.setScale(new Vector3(size.x, size.y, size.z));
	this.physics.setPosition(new Vector3(0, -50, size.y));
	this.physics.setRotation(new Quaternion(1, 0, 0, 1));
	this.ammoobj = this.physics.ammoobj;

	this.mesh = new MeshComponent({
		shape: 'cylinder',
		materialColour: 0xFF00FF
	});
	this.threeobj = this.mesh.threeobj;
	this.threeobj.scale.set(size.x, size.y, size.z);

	var mouse_last = null;
	var dx = 0, dy = 0;
	document.addEventListener('mousemove', function(e) {
		if (Game.getPointerLockEnabled()) {
			dx = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
			dy = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
		}
		else {
			if (!mouse_last)
				mouse_last = {x:e.screenX, y:e.screenY};
			dx = e.screenX - mouse_last.x;
			dy = e.screenY - mouse_last.y;
			mouse_last = {x:e.screenX, y:e.screenY};
		}

		self.mouse_x = self.mouse_x + dx * self.sensitivity;
		self.mouse_y = Math.min(Math.PI, Math.max(0, self.mouse_y + dy * self.sensitivity));

		self.pitch.setFromAxisAngle(self.axis_pitch, self.mouse_y);
		self.yaw.setFromAxisAngle(self.axis_yaw, self.mouse_x);

		self.look = self.yaw.clone();
		self.look.multiply(self.pitch);
	});

	var ch;
	document.addEventListener('keydown', function(e) {
		if (e.repeat) return;

		ch = String.fromCharCode(e.keyCode);
		if (ch == 'W')
			self.move_forward = Math.min(1, self.move_forward + 1);
		else if (ch == 'S')
			self.move_forward = Math.max(-1, self.move_forward -1);
		else if (ch == 'D')
			self.move_right = Math.min(1, self.move_right + 1);
		else if (ch == 'A')
			self.move_right = Math.max(-1, self.move_right -1);
	});

	document.addEventListener('keyup', function(e) {
		ch = String.fromCharCode(e.keyCode);
		if (ch == 'W')
			self.move_forward += -1;
		else if (ch == 'S')
			self.move_forward += 1;
		else if (ch == 'D')
			self.move_right += -1;
		else if (ch == 'A')
			self.move_right += 1;
	});
}

FPSControllerComponent.prototype.update = function(dt) {
	if (!this.entity.has('transform')) return;
	var transform = this.entity.get('transform');

	transform.setRotation(this.look);

	var physpos = this.physics.getPosition();
	var entpos = physpos.clone();
		entpos.add(new Vector3(0, 0, 10));
	transform.setPosition(entpos);

	var pitch = new THREE.Quaternion();
	pitch.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI/2);
	var yaw = this.yaw.clone();
	yaw.multiply(pitch);
	this.physics.setRotation(yaw);

	this.threeobj.position.copy(physpos);
	var physrot = this.physics.getRotation();
	this.threeobj.quaternion.copy(physrot);

	// Movement
	var fwdDir = this.vec_forward.clone();
	fwdDir.applyQuaternion(this.yaw);
	fwdDir.multiplyScalar(this.speed * this.move_forward);

	var rgtDir = this.vec_right.clone();
	rgtDir.applyQuaternion(this.yaw);
	rgtDir.multiplyScalar(this.speed * this.move_right);

	fwdDir.add(rgtDir);

	if (this.physics.getLinearVelocity().length() < this.speed)
		this.physics.applyCentralImpulse(fwdDir);
}

Components.register('fpscontroller', FPSControllerComponent, {
	
});
