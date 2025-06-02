class ExServers {
    constructor(ex_sqlite) {
        this.db = ex_sqlite;
    }

    listServers(callback) {
        return this.db.all("SELECT * FROM ex_servers", callback);
    }

    insertServer(name, plugin, filepath, email_verify, serverip, callback) {
        return this.db.run("INSERT INTO ex_servers (name, plugin, filepath, email_verify, serverip) VALUES (?, ?, ?, ?, ?)", [name, plugin, filepath, email_verify, serverip], callback);
    }

    updateServer(id, name, plugin, filepath, email_verify, serverip, callback) {
        return this.db.run("UPDATE ex_servers SET name = ?, plugin = ?, filepath = ?, email_verify = ?, serverip = ? WHERE ID = ?", [name, plugin, filepath, email_verify, serverip, id], callback);
    }

    deleteServer(id, callback) {
        return this.db.run("DELETE FROM ex_servers WHERE ID = ?", [id], callback);
    }

    getServer(id, callback) {
        return this.db.get("SELECT * FROM ex_servers WHERE ID = ?", [id], callback);
    }
}

module.exports = ExServers;