const sqlite3 = require('sqlite3').verbose();
const info = require('../utils/info');
const fs = require('fs');
const path = require('path');

let dbPath = path.join(__dirname, '../saves/database/exence.db');
let bakDbPath = path.join(__dirname, '../saves/database/exence.bak.db');

if (!fs.existsSync(dbPath)) {
    info('info', `未在${dbPath}找到数据库，即将使用备份数据库。`);
    if (fs.existsSync(bakDbPath)) {
        fs.copyFileSync(bakDbPath, dbPath);
    } else {
        info('error', `未在${bakDbPath}找到备份数据库，请重新安装程序。`);
        process.exit(1);
    }
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        info('error', `无法打开数据库：${err.message}，请重新安装程序或使用备份数据库。`);
        process.exit(1);
    } else {
        info('info', '成功连接到SQLite数据库。');
    }
})

module.exports = db;