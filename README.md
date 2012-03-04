Middleware layer for the node-xmpp library. For the time being there's simple support for Roster and basic events. 

This lib includes a simple data structure User:


	function User( jid, name ) {
		this._jid = jid || '';
		this._name = name || '';
		this._status = '';
		this._online = false;
	};

	/*
		...
		Various methods
		...
	*/




#### Events


    var cl = new Client({ 
    	'jid' 		: 'lol@lol.dk/lol',
    	'password' 	: 'fisogballade',
    	'host' 		: "xmpp.example.com",
    	'port' 		: 5222
	});

	cl.on('message', function( user, message ) {
    	console.log('Received message: ' + message + ' from ' + user.name() );
	});

	cl.on('status', function( user ) {
    	console.log('Received statuschange ' + user.status() + ' from: ' + user.name());
	});
    
	cl.on('userOnline', function( user ) {
    	console.log(user.name() + ' is online! :)');
	});

	cl.on('userOffline', function( user ) {
    	console.log(user.name() + ' went offline! :(');
	});



#### Methods

Finding users in the roster:


	var user = cl.findUserByName( 'Preben' );
	var user = cl.findUserByJID( 'Preben@xmpp.example.com' );

	console.log('Prebens status is ' + user.status());


Looping over online users in the roster:


	cl.forEachUser(function( user ) {
		console.log( user.name() + 'is online!' );
	});

Sending messages to a user:

	cl.sendMessage( user, 'YOU WON THE LOTTERY!!' );
