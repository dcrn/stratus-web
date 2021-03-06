FlyControllerComponent = function() {
	var self = this;
	this.look = new Quaternion();
	this.look.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI/2);
	this.yaw = new Quaternion(0, 1, 0, 0);
	this.pitch = new Quaternion(1, 0, 0, 0);

	this.axis_pitch = new Vector3(1, 0, 0);
	this.axis_yaw = new Vector3(0, 0, 1);
	this.vec_forward = new Vector3(0, 0, -1);
	this.vec_right = new Vector3(1, 0, 0);
	this.vec_up = new Vector3(0, 0, 1);

	this.move_forward = 0;
	this.move_right = 0;
	this.move_up = 0;

	this.sensitivity = -0.005;

	this.mouse_x = 0;
	this.mouse_y = Math.PI/2;

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

	// Listen for key events to allow movement via the WASD, Shift and Space keys.
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
		else if (ch == ' ')
			self.move_up = Math.min(1, self.move_up + 1);
		else if (e.keyCode == 16)
			self.move_up = Math.max(-1, self.move_up -1);
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
		else if (e.keyCode == 16)
			self.move_up += 1;
		else if (ch == ' ')
			self.move_up += -1;
	});
}

FlyControllerComponent.prototype.update = function(dt) {
	if (dt === 0 || !this.entity.has('transform')) return;
	
	var transform = this.entity.get('transform');
	// Update the rotation of the transform based on the look quaternion
	transform.setRotation(this.look)

	// For each movement direction (forward, right, up), 
	// 	add the position to the transform component's position
	if (this.move_forward != 0) {
		var p = transform.getPosition();

		var dir = this.vec_forward.clone();
		dir.applyQuaternion(this.look);
		dir.multiplyScalar(this.move_forward);

		transform.setPosition(p.add(dir));
	}

	if (this.move_right != 0) {
		var p = transform.getPosition();

		var dir = this.vec_right.clone();
		dir.applyQuaternion(this.look);
		dir.multiplyScalar(this.move_right);

		transform.setPosition(p.add(dir));
	}

	if (this.move_up != 0) {
		var p = transform.getPosition();

		var dir = this.vec_up.clone();
		dir.multiplyScalar(this.move_up);

		transform.setPosition(p.add(dir));
	}
}

Components.register('flycontroller', FlyControllerComponent, {
	
});
