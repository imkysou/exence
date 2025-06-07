const crypto = require("crypto");
const nodemailer = require("nodemailer");
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
        this.transporter = nodemailer.createTransport(config.email_verify.smtp);
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

            // 检测邮箱是否正确
            if (!email || !email.match(/^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/)) {
                return res.json({
                    code: 1,
                    msg: "邮箱格式错误"
                });
            }

            // 若启用邮箱验证，检测验证码是否正确
            if (config.email_verify.enable) {
                if (!req.session.emailVerifyCode) {
                    return res.json({
                        code: 1,
                        msg: "请先获取邮箱验证码"
                    });
                }
                if (!req.body.emailVerifyCode || req.body.emailVerifyCode !== req.session.emailVerifyCode) {
                    return res.json({
                        code: 1,
                        msg: "邮箱验证码错误"
                    });
                }
                // 清除邮箱验证码
                delete req.session.emailVerifyCode;
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

                // 先检测游戏名是否已经存在
                db.get(`SELECT * FROM authme WHERE username = ?`, [name.toLowerCase()], (err, row) => {
                    if (err) {
                        info('error', '数据库错误:' + err);
                        return res.json({
                            code: 1,
                            msg: "数据库错误"
                        });
                    }
                    if (row) {
                        return res.json({
                            code: 1,
                            msg: "游戏名已存在"
                        });
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

    sendVerifyEmail(req, res) {
        try {
            const { email } = req.body;
            const verifyCode = Math.random().toString().substr(2, 6);
            // 检查邮箱格式
            if (!email || !email.match(/^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/)) {
                return res.json({
                    code: 1,
                    msg: "邮箱格式错误"
                });
            }
            // 邮件对象
            const mailOptions = {
                html: "您正在注册Minecraft服务器账号，您的验证码为：" + verifyCode,
                from: config.email_verify.from,
                to: email,
                subject: "您的验证码为" + verifyCode
            };
            // 将邮箱验证码写入cookie
            req.session.emailVerifyCode = verifyCode;
            // 发送邮件
            this.transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    info('error', '发送邮件失败:' + error);
                    return res.json({
                        code: 1,
                        msg: "发送邮件失败"
                    });
                }
                return res.json({
                    code: 0,
                    msg: "发送邮件成功"
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
}

module.exports = Server;