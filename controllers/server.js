const crypto = require("crypto");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const config = require("../exence.global");
const info = require("../utils/info");
const CaptchaGenerator = require("../utils/captcha");
const ExServers = require("../services/ex_servers");


const captchaGenerator = new CaptchaGenerator();
class Server {
    constructor(app, ex_sqlite) {
        this.app = app;
        this.db = ex_sqlite;
        this.exServers = new ExServers(ex_sqlite);
        this.hash = Math.random().toString(36).substr(2);
    }

    info(req, res) {
        try {
            const { server_id } = req.query;
            this.exServers.getServer(server_id, (err, row) => {
                if (err) {
                    info('error', '数据库错误:' + err);
                    return res.json({
                        code: 1,
                        msg: "数据库错误"
                    });
                }
                if (row) {
                    return res.json({
                        code: 0,
                        msg: "获取成功",
                        name: row.name
                    });
                }
                if (config.email_verify.enable !== true) {
                    fs.access(row.filepath, fs.constants.F_OK, (err) => {
                        if (err) {
                            return res.json({
                                code: 1,
                                msg: "获取失败"
                            });
                        }
                    })
                }
                return res.json({
                    code: 1,
                    msg: "获取失败"
                });
            });
        } catch(err) {
            info('error', '服务器错误，' + err);
            return res.json({
                code: 1,
                msg: "服务器错误"
            });
        }
    }

    register(req, res) {
        try {
            const { id, name, email, password, captcha } = req.body;

            const { secret, hash } = req.session.captcha || {};
            const isValid = captchaGenerator.verify(captcha, secret, hash);
            delete req.session.captcha;
            if (isValid === false) {
                return res.json({
                    code: 1,
                    msg: "验证码错误"
                });
            }

            let row;
            this.exServers.getServer(id, (err, row) => {
                if (err) {
                    info('error', '数据库错误:' + err);
                    return res.json({
                        code: 1,
                        msg: "数据库错误"
                    });
                }
                if (!row) {
                    return res.json({
                        code: 1,
                        msg: "服务器不存在"
                    });
                }
                const db = new sqlite3.Database(row.filepath, (err) => {
                    if (err) {
                        info('error', `无法打开数据库：${err.message}，请重新安装程序或使用备份数据库。`);
                        process.exit(1);
                    } else {
                        info('info', '成功连接到SQLite数据库。');
                    }
                });
                let pwd = crypto.createHash('SHA256').update(password).digest('hex');
                // 获得16位的随机数
                let random = crypto.randomBytes(16).toString('hex').substring(0, 16);
                pwd = crypto.createHash('SHA256').update(pwd + random).digest('hex');
                pwd = `$SHA$${random}$${pwd}`;

                let ip = "";
                if (config.remoteIP.method == "legacy") {
                    ip = req.connection.remoteAddress
                } else if (config.remoteIP.method == "proxy") {
                    ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                } else {
                    ip = req.headers[config.remoteIP.Header];
                }

                db.run(`INSERT INTO authme (username, realname, password, ip, email) VALUES (?, ?, ?, ?, ?)`, [name.toLowerCase(), name, pwd, ip, email], (err) => {
                    if (err) {
                        info('error', '数据库错误:' + err);
                        return res.json({
                            code: 1,
                            msg: "数据库错误"
                        });
                    }
                    db.close();
                    return res.json({
                        code: 0,
                        msg: "成功注册游戏账号"
                    });
                })
            });
        } catch(err) {
            info('error', '服务器错误，' + err);
            return res.json({
                code: 1,
                msg: "服务器错误"
            });
        }
    }

}

module.exports = Server;