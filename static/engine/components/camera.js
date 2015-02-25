CameraComponent = function(options) {
	options = options || {};
	options.fov = options.fov || 75;
	options.aspectRatio = options.aspectRatio || 16/9;
	options.near = options.near || 0.1;
	options.far = options.far || 1000.0;

	this.threeobj = new THREE.PerspectiveCamera();
	this.threeobj.up.set(0, 0, 1);

	this.setFov(options.fov, true);
	this.setAspectRatio(options.aspectRatio, true);
	this.setNear(options.near, true);
	this.setFar(options.far, true);

	this.threeobj.updateProjectionMatrix();
}

CameraComponent.prototype.update = function (dt) {
	if (!this.entity.has('transform')) return;
	var transform = this.entity.get('transform');

	this.threeobj.position.copy(transform.getPosition());
	this.threeobj.quaternion.copy(transform.getRotation());
}

CameraComponent.prototype.activate = function() {
	Game.setActiveCamera(this);
}

CameraComponent.prototype.getFov = function() {
	return this.threeobj.fov;
}

CameraComponent.prototype.setFov = function(v, noUpdate) {
	this.threeobj.fov = v;
	
	if (!noUpdate)
		this.threeobj.updateProjectionMatrix();
}

CameraComponent.prototype.getAspectRatio = function() {
	return this.threeobj.aspect;
}

CameraComponent.prototype.setAspectRatio = function(v, noUpdate) {
	this.threeobj.aspect = v;
	
	if (!noUpdate)
		this.threeobj.updateProjectionMatrix();
}

CameraComponent.prototype.getNear = function() {
	return this.threeobj.near;
}

CameraComponent.prototype.setNear = function(v, noUpdate) {
	this.threeobj.near = v;
	
	if (!noUpdate)
		this.threeobj.updateProjectionMatrix();
}

CameraComponent.prototype.getFar = function() {
	return this.threeobj.far;
}

CameraComponent.prototype.setFar = function(v, noUpdate) {
	this.threeobj.far = v;
	
	if (!noUpdate)
		this.threeobj.updateProjectionMatrix();
}

Components.register('camera', CameraComponent);
