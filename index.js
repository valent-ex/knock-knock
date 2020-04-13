const dns = require('dns');
const fs = require('fs');
const readline = require('readline');

const whoiser = require('whoiser');
const logUpdate = require('log-update');

var config_path;
if (fs.existsSync('./config.json')) {
    config_path = './config.json';
} else {
    config_path = './default_config.json';
}

var config = JSON.parse(fs.readFileSync(config_path));

function parseFormula(f, f_index = 0, f_prev = []) {
    var f_el = f.charAt(f_index);
    if (!config.hasOwnProperty(f_el)) {
        console.log(`\nError: unknown formula variable "${f_el}"`)
        process.exit();
    }
    var f_source = config[f_el];
    var f_step = [];

    if (f_prev.length > 0) {
        f_prev.forEach((f_prev_item) => {
            if (f_source == 'palindrome') {
                f_step.push(f_prev_item + f_prev_item.charAt(f.length - 1 - f_index));
            } else if (f_source == 'previous') {
                f_step.push(f_prev_item + f_prev_item.charAt(f_index - 1));
            } else {
                f_source.forEach((f_source_item) => {
                    f_step.push(f_prev_item + f_source_item);
                })
            }            
        })
    } else {
        f_step = f_source;
    }

    if (f_index+1 < f.length) {
        return parseFormula(f, f_index+1, f_step);
    } else {
        console.log(`\nDomains found by formula: ${f_step.length}\n`);
        return f_step;
    }
}

function checkDomains(formula, tld, rpm) {
    var unchecked_domains = parseFormula(formula);
    var checked_domains = [];
    var available_domains = [];
    var promises_domains = [];
    var errors = [];

    const log_frames = ['-', '\\', '|', '/'];
    let log_i = 0;
    var log = setInterval(() => {
        const frame = log_frames[log_i = ++log_i % log_frames.length];
        logUpdate(`${frame} Checking domains for availability... \nProgress: [${checked_domains.length}/${unchecked_domains.length}] Found: [${available_domains.length}] Errors: [${errors.length}]`);
    }, 200);
    
    var check_timeout = 0;
    var check_timeout_step = 60*1000/rpm;
    unchecked_domains.forEach((domain) => {
        promises_domains.push(new Promise((resolve, reject) => {
            check_timeout = check_timeout + check_timeout_step;
            setTimeout(function() {                
                domain = domain + '.' + tld;
                dns.lookup(domain, (err, address, family) => {
                    if (typeof address === 'undefined') {                        
                        var w = whoiser.domain(domain, {timeout: 5000});
                        w.then(w_data => {
                            if (w_data) {
                                var w_data_a = w_data[Object.keys(w_data)[0]];
                                if (!w_data_a.hasOwnProperty('Domain Name') 
                                    && !w_data_a.hasOwnProperty('Created Date')
                                    && w_data_a.hasOwnProperty('text')
                                    && w_data_a['text'][0] != 'Reserved by the registry.') {
                                    available_domains.push(domain);
                                }
                            } else {
                                errors.push(domain);
                            }
                            checked_domains.push(domain);
                            resolve();
                        },
                        e => {
                            checked_domains.push(domain);
                            errors.push(domain);
                            resolve();
                            throw e;
                        });                      
                    } else {
                        checked_domains.push(domain);
                        resolve();
                    }
                });
            }, check_timeout);
        }));    
    });
    
    Promise.all(promises_domains).then(() => {        
        clearInterval(log);
        logUpdate.clear();
        console.log(`Available domains found: ${available_domains.length}`);

        available_domains = available_domains.sort(function (a, b) { if (a < b) return -1; else if (a > b) return 1; return 0; });

        var filename = 'results/' + formula + '_' + tld;
        fs.open(filename, 'w', function (err, file) { if (err) throw err });
        fs.writeFile(filename, available_domains.join('\n'), function (err) {
            if (err) throw err;
            console.log(`Results saved to "${filename}"`);
        });
    });
}

console.log('\nKnock-knock, are these domains available?\n');
console.log('Found these formula variables in config:');
for (let [config_key, config_value] of Object.entries(config)) {
    console.log(`${config_key} – ${config_value}`);
}
const rl = readline.createInterface({input: process.stdin, output: process.stdout});
rl.question('\nFormula (e.g. «abyy»): ', (formula) => {
    rl.question('TLD (e.g. «io»): ', (tld) => {
        rl.question('Requests per minute (e.g. «20»): ', (rpm) => {
            rl.close();
            checkDomains(formula, tld, rpm);
        });        
    });
});