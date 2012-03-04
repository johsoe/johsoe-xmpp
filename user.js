



function User( jid, name ) {
	
	this._jid = jid || '';
	this._name = name || '';
	this._status = '';
	this._online = false;

};

User.prototype.isOnline = function() {
	return this._online;
}

User.prototype.online = function() {
	this._online = true;
}

User.prototype.offline = function() {
	this._online = false;
}

User.prototype.status = function( status ) {
	if( status ) {
		this._status = status;
		return this;
	}

	return this._status;
}

User.prototype.jid = function( jid ) {
	if( jid ) {
		this._jid = jid;
		return this;
	}

	return this._jid;
}

User.prototype.name = function( name ) {
	if( name ) {
		this._name = name;
		return this;
	}

	return this._name;
}

module.exports = User;