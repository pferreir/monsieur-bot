/**
 * Echo Bot - the XMPP Hello World
 **/
var xmpp = require('node-xmpp'),
    muc = require('./muc'),
    bot = require('./bot');

var fs = require('fs');

var default_config = {
	status: 'Bonjour.',
	muc_nick: 'monsieur_bot',
	extensions: [],
	extension_dir: './ext',
	db_path: ':memory:'
};

function load_config(config_file, defaults) {
	var data = fs.readFileSync(config_file), config;

	try {
		var config = JSON.parse(data);

		for(setting in default_config) {
			if (config[setting] === undefined) {
				config[setting] = defaults[setting];
			}
		}
		return config
	}
	catch (err) {
		console.log('Error parsing config')
		console.log(err);
	}
}

function main() {

	var config = load_config('./config.json', default_config);

	// set events
	var b = new bot.Bot(config);
	var m = new muc.MUC(b);

	b.initialize();
}

main();