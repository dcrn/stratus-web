/*
 This component combines the Fly Controller and a physics object to provide the player
 	with an experience similar to a first person shooter game.
 It requires that the parent entity has a transform component, and a camera is optional.
*/

FPSControllerComponent = function() {
	var self = this;
	this.look = new Quaternion();
	this.look.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI/2);
	this.yaw = new Quaternion(0, 1, 0, 0);
	this.pitch = new Quaternion(1, 0, 0, 0);

	this.axis_pitch = new Vector3(1, 0, 0);
	this.axis_yaw = new Vector3(0, 0, 1);
	this.vec_forward = new Vector3(0, 1, 0);
	this.vec_right = new Vector3(1, 0, 0);

	this.move_forward = 0;
	this.move_right = 0;

	this.sensitivity = -0.0035;
	this.speed = 150;

	this.mouse_x = 0;
	this.mouse_y = Math.PI/2;

	// Create a new physics component, and store it locally instead of adding it to the parent entity.
	this.physics = Components.create('physics', {
		shape: 'cylinder',
		mass: 100,
		angularDamping: 10000,
		friction: 0.9,
		damping: 0.0
	});

	// Expose the physics object through this component
	this.ammoobj = this.physics.ammoobj;

	// Set the position, scale and rotation of the physics object
	var size = {x: 2, y:16, z: 2};
	this.physics.setScale(new Vector3(size.x, size.y, size.z));
	this.physics.setPosition(new Vector3(0, -50, size.y));
	this.physics.setRotation(new Quaternion(0.707, 0, 0, 0.707));

	// Listen for mouse movement and update the look quaternion accordingly
	var mouse_last = null;
	var dx = 0, dy = 0;
	document.addEventListener('mousemove', function(e) {
		// Get the difference in mouse movement between events, using the appropriate 
		// Event property depending on if pointer lock is enabled.
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
		// Lock vertical mouse movement so it can't go all the way around.
		self.mouse_y = Math.min(Math.PI, Math.max(0, self.mouse_y + dy * self.sensitivity));

		// Set up the pitch and yaw quaternions
		self.pitch.setFromAxisAngle(self.axis_pitch, self.mouse_y);
		self.yaw.setFromAxisAngle(self.axis_yaw, self.mouse_x);

		// Apply the pitch to the yaw quaternion to create the look quaternion
		// Doing this in the opposite order produces unwanted results
		self.look = self.yaw.clone();
		self.look.multiply(self.pitch);
	});

	// Listen for key events to allow movement via the WASD keys.
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
	if (dt === 0 || !this.entity.has('transform')) return;
	var transform = this.entity.get('transform');

	// Set the transform to point in the direction the player is facing
	transform.setRotation(this.look);

	// Update the entity position from the physics component
	var physpos = this.physics.getPosition();
	var entpos = physpos.clone();
		entpos.add(new Vector3(0, 0, 10));
	transform.setPosition(entpos);

	// Change the physics object's rotation based on yaw vector alone 
	// (The body doesn't pitch when looking up or down)
	var pitch = new Quaternion();
	pitch.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI/2);
	var yaw = this.yaw.clone();
	yaw.multiply(pitch);
	this.physics.setRotation(yaw);

	// Movement
	// Get the forward and right directions, multiplying them by the movement scalar
	var fwdDir = this.vec_forward.clone();
	fwdDir.applyQuaternion(this.yaw);
	fwdDir.multiplyScalar(this.speed * this.move_forward);

	var rgtDir = this.vec_right.clone();
	rgtDir.applyQuaternion(this.yaw);
	rgtDir.multiplyScalar(this.speed * this.move_right);

	// Add the movement vectors together
	fwdDir.add(rgtDir);

	// Apply the force to the physics object to move it
	if (this.physics.getLinearVelocity().length() < this.speed)
		this.physics.applyCentralImpulse(fwdDir);
}

Components.register('fpscontroller', FPSControllerComponent, {
	
});
