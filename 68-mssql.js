/**
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var reconnect = RED.settings.mssqlReconnectTime || 30000;
    var sql = require('mssql');

    function mssqlNode(n) {
        //console.dir(n);
		RED.nodes.createNode(this,n);
        this.host = n.host;
        this.port = n.port;
        this.tz = n.tz || "local";

        this.connected = false;
        this.connecting = false;

        this.dbname = n.db;
        var node = this;

        function doConnect() {
            //console.log("doConnect");
			node.connecting = true;
            var config = {
				user: node.credentials.user,
				password: node.credentials.password,
				server: node.host, // You can use 'localhost\\instance' to connect to named instance
				database: node.dbname,
				options: {
					encrypt: true // Use this if you're on Windows Azure
				}
			};
			node.connection = new sql.Connection(config);

			node.connection.on('error', function(err) {
                node.connected = false;
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    doConnect(); // silently reconnect...
                } else {
                    node.error(err);
                    doConnect();
                }
            });
        }

        this.connect = function() {
            //console.log("calling connect");
			if (!this.connected && !this.connecting) {
                doConnect();
            }
        }

        this.on('close', function (done) {
            if (this.tick) { clearTimeout(this.tick); }
            if (this.connection && this.connection.connected) {
                node.connection.close(function(err) {
                    if (err) { node.error(err); }
                    done();
                });
            } else {
                done();
            }
        });
    }
    RED.nodes.registerType("mssqldatabase",mssqlNode, {
        credentials: {
            user: {type: "text"},
            password: {type: "password"}
        }
    });


    function sqlNodeIn(n) {
        RED.nodes.createNode(this,n);
        //console.dir(n);
		this.mydb = n.mydb;
        this.mydbConfig = RED.nodes.getNode(this.mydb);

        if (this.mydbConfig) {
            this.mydbConfig.connect();
            var node = this;
            node.on("input", function(msg) {
                if (typeof msg.topic === 'string') {
                    //console.log("query:",msg.topic);
                    var bind = Array.isArray(msg.payload) ? msg.payload : [];
                    node.mydbConfig.connection.connect(function(err) {
						var request = node.mydbConfig.connection.request(); // or: var request = connection.request();
						request.query(msg.topic, function(err, recordset) {
							if (err) { node.warn(err); }
							else {
								msg.payload = recordset;
								node.send(msg);
							}
							//console.dir(recordset);
						});
					});
                }
                else {
                    if (typeof msg.topic !== 'string') { node.error("msg.topic : the query is not defined as a string"); }
                }
            });
        }
        else {
            this.error("mssql database not configured");
        }
    }
    RED.nodes.registerType("mssql",sqlNodeIn);
}
