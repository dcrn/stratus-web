MeshComponent = function(options) {
	options = options || {};
	if (!('shape' in options))
		options.shape = 'box';
	if (!('castShadow' in options))
		options.castShadow = false;
	if (!('receiveShadow' in options))
		options.receiveShadow = false;
	if (!('materialType' in options))
		options.materialType = 'lambert';
	if (!('materialColour' in options))
		options.materialColour = 0xFFFFFF;

	this.threeobj = new THREE.Mesh();
	this.threeobj.up.set(0, 0, 1);

	this.setShape(options.shape);
	this.setMaterialType(options.materialType);
	this.setMaterialColour(options.materialColour);
	this.setCastShadow(options.castShadow);
	this.setReceiveShadow(options.receiveShadow);
}

MeshComponent.prototype.update = function (dt) {
	if (!this.entity.has('transform')) return;
	var transform = this.entity.get('transform');

	this.threeobj.position.copy(transform.getPosition());
	this.threeobj.quaternion.copy(transform.getRotation());
	this.threeobj.scale.copy(transform.getScale());
}

MeshComponent.prototype.getShape = function() {
	return this.shape;
}

MeshComponent.prototype.setShape = function(s) {
	this.shape = s;
	
	if (s == 'plane')
		this.threeobj.geometry = new THREE.PlaneBufferGeometry(1, 1);
	else if (s == 'sphere')
		this.threeobj.geometry = new THREE.SphereGeometry(0.5);
	else if (s == 'cylinder')
		this.threeobj.geometry = new THREE.CylinderGeometry(0.5, 0.5, 1);
	else
		this.threeobj.geometry = new THREE.BoxGeometry(1, 1, 1);
}

MeshComponent.prototype.getMaterialType = function() {
	return this._materialType;
}

MeshComponent.prototype.setMaterialType = function(t) {
	this._materialType = t;

	if (t == 'phong')
		this.threeobj.material = new THREE.MeshPhongMaterial();
	else if (t == 'lambert')
		this.threeobj.material = new THREE.MeshLambertMaterial();
	else if (t == 'basic')
		this.threeobj.material = new THREE.MeshBasicMaterial();

	if (this._materialColour)
		this.threeobj.material.color.setHex(this._materialColour);
}

MeshComponent.prototype.getMaterialColour = function(c) {
	return this._materialColour;
}

MeshComponent.prototype.setMaterialColour = function(c) {
	this._materialColour = c;
	this.threeobj.material.color.setHex(c);
}

MeshComponent.prototype.getCastShadow = function() {
	return this.threeobj.castShadow;
}

MeshComponent.prototype.setCastShadow = function(b) {
	this.threeobj.castShadow = b;
}

MeshComponent.prototype.getReceiveShadow = function() {
	return this.threeobj.receiveShadow;
}

MeshComponent.prototype.setReceiveShadow = function(b) {
	this.threeobj.receiveShadow = b;
}

Components.register('mesh', MeshComponent);
