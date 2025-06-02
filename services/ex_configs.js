class ExConfigs {
    constructor(ex_sqlite) {
        this.db = ex_sqlite;
    }
    
    getData(name, callback) {
        return this.db.get("SELECT data FROM ex_configs WHERE name = ?", [name], callback);
    }

    updateData(name, data, callback) {
        return this.db.run("UPDATE ex_configs SET data = ? WHERE name = ?", [data, name], callback);
    }

    // 主要用于后台插入模板数据
    insertData(name, data, callback) {
        return this.db.run("INSERT INTO ex_configs (name, data) VALUES (?, ?)", [name, data], callback);
    }

    // 主要用于后台删除模板数据
    deleteData(name, callback) {
        return this.db.run("DELETE FROM ex_configs WHERE name = ?", [name], callback);
    }

    listData(callback) {
        return this.db.all("SELECT * FROM ex_configs", callback);
    }
}

module.exports = ExConfigs;