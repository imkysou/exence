class ExConfigs {
    constructor(ex_sqlite) {
        this.db = ex_sqlite;
    }
    
    getData(name, callback) {
        return this.db.get("SELECT data FROM configs WHERE name = ?", [name]);
    }

    updateData(name, data, callback) {
        return this.db.run("UPDATE configs SET data = ? WHERE name = ?", [data, name]);
    }

    // 主要用于后台插入模板数据
    insertData(name, data, callback) {
        return this.db.run("INSERT INTO configs (name, data) VALUES (?, ?)", [name, data]);
    }

    // 主要用于后台删除模板数据
    deleteData(name, callback) {
        return this.db.run("DELETE FROM configs WHERE name = ?", [name]);
    }
}

module.exports = ExConfigs;