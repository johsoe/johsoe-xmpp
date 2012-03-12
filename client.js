var	xmpp = require('node-xmpp'),
	events = require('events'),
	User = require('./user'),
	util = require('util');

function Client( options ) {
	var self 	= this;

	self.options = options || {};

	self.options.keepaliveinternal = options.keepaliveinternal || 60 * 1000;

	self.roster = [];

	self.cl 	= new xmpp.Client( options );

	events.EventEmitter.call(this);	
	
	self.cl.on('stanza', function( stanza ) {
		self.stanzaListener( stanza );
	});	

	self.cl.on('online', function() {
		self.requestRoster();

		self.emit('online');

		// Keep alive
		setInterval(function () {
			self.cl.send( new xmpp.Element( 'presence' ) );
		}, self.options.keepaliveinternal );
	});
};

util.inherits(Client, events.EventEmitter);

/*

	"Private" methods

*/

Client.prototype.requestRoster = function( roster ) {
	var self = this;

	var roster = roster || 'roster_1';

	var getRosterStanza = new xmpp.Element( 
		'iq', 
		{  
			'from'	: self.cl.jid.toString(),
			'type'	: 'get',
			'id'	: roster
		}
    ).c('query', {'xmlns':'jabber:iq:roster'});

	if( self.options.debug )
		console.log('Requesting Roster');
    
    self.cl.send( getRosterStanza );
}

Client.prototype.initPresence = function() {
	var self = this;

	// Empty presence stanza to signal availability
	var presence = new xmpp.Element( 
		'presence', 
		{  'from': self.cl.jid.toString() }
    );

	if( self.options.debug )
		console.log('Sending initPresence');
	
	self.cl.send( presence );
}

Client.prototype.stanzaListener = function( stanza ) {

	if( stanza.is('message') )
		this.stanzaMessage( stanza );

	else if( stanza.is('iq') )
		this.stanzaIq( stanza );

	else if( stanza.is('presence') )
		this.stanzaPresence( stanza );

};

Client.prototype.stanzaMessage = function( stanza ) {
	var self = this;
	var message;
	var jid = stanza.attr('from').substring( 0 , stanza.attr('from').indexOf('/') );
	var user = self.findUserByJID( jid );

	try {
		message = stanza.children[0].children[0];
	} catch( e ) {
		console.log( 'Stanza parsing failure --> ', e );
	}       

	try {
		this.emit('message', user, message);	
	} catch( e ) {
		console.log('couldnt emit()', e );
	}
	
	if( self.options.debug )
		console.log('stanzaMessage() -> ', stanza.children[0].children);

};

Client.prototype.stanzaIq = function( stanza ) {
	var self = this;

	if( stanza.attr('type') == 'result' ) {
		self.parseRosterResult( stanza );
	}

	self.initPresence();

	//console.log('stanzaIq() -> ', stanza.children[0].children);
	//console.log('stanzaIq() -> ', stanza);
};

Client.prototype.stanzaPresence = function( stanza ) {
	var self 	= this;
	var jid 	= stanza.attr('from').substring( 0 , stanza.attr('from').indexOf('/') );
	var user 	= self.findUserByJID( jid );
	var status 	= stanza.getChildText('status');
	var type 	= stanza.attr('type');
	

	if( !user )
		return;

	if( type === 'unavailable' ) {
		user.status('');
		user.offline();
		this.emit('userOffline', user);
		return;
	}

	if( status ) {
		user.status( status );
		this.emit('status', user);
	} else {
		user.status( '' );
		this.emit('status', user);
	} 

	user.online();
	this.emit('userOnline', user);
};



Client.prototype.parseRosterResult = function( stanza ) {
	var self 	= this;
	var query 	= stanza.children[0].children;

	if( query.length == 0 )
		return;

	for( var i in query ) {
		self.roster.push( new User( 
			query[i].attr('jid'),
			query[i].attr('name')
		));
	}
};

/*
	
	"Public" methods

*/

Client.prototype.findUserByName = function( name ) {
	for( var i in this.roster ) {
		if( this.roster[i].name().toLowerCase() === name.toLowerCase() ) {
			return this.roster[i];
		}
			
	}

	return null;
}

Client.prototype.findUserByJID = function( jid ) {
	for( var i in this.roster ) {
		if( this.roster[i].jid().toLowerCase() === jid.toLowerCase() ) {
			return this.roster[i];
		}
			
	}

	return null;
}

Client.prototype.getOnlineUsers = function() {
	var onlineUsers = [];

	for( var i in this.roster ) {
		if( this.roster[i].isOnline() )
			onlineUsers.push( this.roster[i] );
	}

	return onlineUsers;
}

Client.prototype.forEachUser = function( callback ) {
	if( typeof callback !== 'function' ) {
		console.log('forEachUser -> callback is not a function!');
		return;
	}

	for( var i in this.roster ) {
		if( this.roster[i].isOnline() )
			callback( this.roster[i] );
	}
}

Client.prototype.sendMessage = function( to, message ) {
	var self 	= this;

	var stanza = new xmpp.Element(
		'message',
        { 	
        	'to': to.jid(), 
            'from': self.cl.jid.toString(), 
            'type': 'chat'
        }
    ).c('body').t( message );

	self.cl.send( stanza );
};

module.exports = Client;
