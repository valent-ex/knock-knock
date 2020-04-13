// const dns = require('dns');
// const fs = require('fs');
// const readline = require('readline');

// const whois = require('whois');
// const whoiser = require('whoiser');
// const logUpdate = require('log-update');

// var domain = 'aga.app';

// var w = whoiser.domain(domain, {timeout: 5000});
// w.then(w_data => {
//     console.log(w_data);
//     if (w_data) {        
//         var w_data_a = w_data[Object.keys(w_data)[0]];
//         if (!w_data_a.hasOwnProperty('Domain Name') 
//             && !w_data_a.hasOwnProperty('Created Date')
//             && w_data_a.hasOwnProperty('text')
//             && w_data_a['text'][0] != 'Reserved by the registry.') {
//             console.log('ok');
//         } else {
//             console.log('not ok');
//         }
//     } else {
//         console.log('error');
//     }
//     console.log('done');
// },
// e => {
//     console.log('error');
//     console.log('done');
//     throw e;
// });

var unirest = require("unirest");

var req = unirest("GET", "https://whoisapi-domain-availability-v1.p.rapidapi.com/whoisserver/WhoisService");

req.query({
	"outputFormat": "JSON",
	"domainname": "test.com",
	"cmd": "undefined"
});

req.headers({
	"x-rapidapi-host": "whoisapi-domain-availability-v1.p.rapidapi.com",
	"x-rapidapi-key": "bbb2b3115dmshede44460772bab5p1e3d8cjsn236d238f097d"
});


req.end(function (res) {
	if (res.error) throw new Error(res.error);

	console.log(res.body);
});