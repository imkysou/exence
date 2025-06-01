class ExAdmin {
    constructor(ex_sqlite) {
        this.db = ex_sqlite;
    }

    getAdmin(username, password, callback) {
        return this.db.get("SELECT * FROM ex_admin WHERE username = ? AND password = ?", [username, password], callback);
    }

    createAdmin(username, password, callback) {
        return this.db.run("INSERT INTO ex_admin (username, password) VALUES (?, ?)", [username, password], callback);
    }

    listAdmins(callback) {
        return this.db.get("SELECT * FROM ex_admin", callback);
    }
}

module.exports = ExAdmin;