const path = require('path');
const fs = require('fs').promises;

async function test() {
    const config = JSON.parse(await fs.readFile('config.json', 'utf8'));
    
    // fetch server connection
    const res = await fetch('https://plex.tv/api/v2/resources?includeHttps=1', {
        headers: { 'X-Plex-Token': config.plexToken, 'Accept': 'application/json' }
    });
    const resources = await res.json();
    const server = resources.find(r => r.clientIdentifier === config.serverIdentifier);
    if (!server) return console.log("Server not found");
    
    const conn = server.connections.find(c => c.local === false) || server.connections[0];
    const uri = conn.uri;
    
    const historyRes = await fetch(`${uri}/status/sessions/history/all?X-Plex-Token=${config.plexToken}&limit=5`, { headers: { 'Accept': 'application/json' } }).then(r => r.json());
    console.log(JSON.stringify(historyRes.MediaContainer.Metadata[0], null, 2));
}
test();
