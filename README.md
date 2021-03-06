node-red-node-mssql
========================
A <a href="http://nodered.org" target="_new">Node-RED</a> node to read and write to a mssql database.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-mssql


Usage
-----

Allows basic access to a mssql database.

This node uses the <b>query</b> operation against the configured database. This does allow both INSERTS and DELETES.

By it's very nature it allows SQL injection... so <i>be careful out there...</i>

The <b>msg.topic</b> must hold the <i>query</i> for the database, and the result is returned in <b>msg.payload</b>.

Typically the returned payload will be an array of the result rows.

If nothing is found for the key then <i>null</i> is returned.

The reconnect retry timeout in milliseconds can be changed by adding a line to <b>settings.js</b>
    <pre>mssqlReconnectTime: 30000,</pre></p>
