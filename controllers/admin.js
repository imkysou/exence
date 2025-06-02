const crypto = require("crypto");
const info = require("../utils/info");
const CaptchaGenerator = require("../utils/captcha");
const ExAdmin = require("../services/ex_admin");
const ExConfigs = require("../services/ex_configs");
const ExServers = require("../services/ex_servers");


const captchaGenerator = new CaptchaGenerator();
class Admin {
    constructor(app, ex_sqlite) {
        this.app = app;
        this.db = ex_sqlite;
        this.exAdmin = new ExAdmin(ex_sqlite);
        this.exConfigs = new ExConfigs(ex_sqlite);
        this.exServers = new ExServers(ex_sqlite);
    }
    async login(req, res) {
        try {
            const { username, password, captcha } = req.body;

            // 检验验证码
            const { secret, hash } = req.session.captcha || {};
            const isValid = captchaGenerator.verify(captcha, secret, hash);
            delete req.session.captcha;
            if (isValid === false) {
                return res.json({
                    code: 1,
                    msg: "验证码错误"
                });
            }

            // 创建sha256加密密码
            const sha256 = crypto.createHash("sha256");
            sha256.update(password);
            const sha256Password = sha256.digest("hex");

            // 校验用户名和密码
            this.exAdmin.getAdmin(username, sha256Password, (err, row) => {
                if (err) {
                    info('error', '数据库错误:' + err);
                    return res.json({
                        code: 1,
                        msg: "数据库错误"
                    });
                }
                if (row) {
                    req.session.admin = row;
                    return res.json({
                        code: 0,
                        msg: "登录成功"
                    });
                }
                return res.json({
                    code: 1,
                    msg: "用户名或密码错误"
                });
            });
        } catch (err) {
            info('error', '服务器错误:' + err);
            res.json({
                code: 1,
                msg: "服务器错误"
            });
        }
    }
    state(req, res) {
        if (req.session.admin) {
            return res.json({
                code: 0,
                msg: "已登录",
                level: req.session.admin.level,
                username: req.session.admin.username
            });
        } else {
            return res.json({
                code: 1,
                msg: "未登录"
            });
        }
    }
    configs(req, res) {
        if (req.session.admin) {
            this.exConfigs.listData((err, rows) => {
                if (err) {
                    info('error', '数据库错误:' + err);
                    return res.json({
                        code: 1,
                        msg: "数据库错误"
                    });
                }
                return res.json({
                    code: 0,
                    msg: "获取成功",
                    data: rows
                });
            })
        } else {
            return res.json({
                code: 1,
                msg: "未登录"
            });
        }
    }
    delConfig(req, res) {
        try {
            if (req.session.admin) {
                const { name } = req.body;
                this.exConfigs.deleteData(name, (err, row) => {
                    if (err) {
                        info('error', '数据库错误:' + err);
                        return res.json({
                            code: 1,
                            msg: "数据库错误"
                        });
                    }
                    return res.json({
                        code: 0,
                        msg: "删除成功"
                    });
                })
            }
        } catch (err) {
            info('error', '服务器错误:' + err);
            res.json({
                code: 1,
                msg: "服务器错误"
            });
        }
    }
    updateConfig(req, res) {
        try {
            if (req.session.admin) {
                const { name, data } = req.body;
                this.exConfigs.updateData(name, data, (err, row) => {
                    if (err) {
                        info('error', '数据库错误:' + err);
                        return res.json({
                            code: 1,
                            msg: "数据库错误"
                        });
                    }
                    return res.json({
                        code: 0,
                        msg: "更新成功"
                    });
                })
            }
        } catch (err) {
            info('error', '服务器错误:' + err);
            res.json({
                code: 1,
                msg: "服务器错误"
            });
        }
    }
    insertConfig(req, res) {
        try {
            if (req.session.admin) {
                const { name, data } = req.body;
                this.exConfigs.insertData(name, data, (err, row) => {
                    if (err) {
                        info('error', '数据库错误:' + err);
                        return res.json({
                            code: 1,
                            msg: "数据库错误"
                        });
                    }
                    return res.json({
                        code: 0,
                        msg: "插入成功"
                    });
                })
            }
        } catch (err) {
            info('error', '服务器错误:' + err);
            res.json({
                code: 1,
                msg: "服务器错误"
            });
        }
    }

    servers(req, res) {
        if (req.session.admin) {
            this.exServers.listServers((err, rows) => {
                if (err) {
                    info('error', '数据库错误:' + err);
                    return res.json({
                        code: 1,
                        msg: "数据库错误"
                    });
                }
                return res.json({
                    code: 0,
                    msg: "获取成功",
                    data: rows
                });
            })
        }
    }
    updateServer(req, res) {
        try {
            if (req.session.admin) {
                const { id, name, plugin, filepath, email_verify, serverip } = req.body;
                this.exServers.updateServer(id, name, plugin, filepath, email_verify, serverip, (err, row) => {
                    if (err) {
                        info('error', '数据库错误:' + err);
                        return res.json({
                            code: 1,
                            msg: "数据库错误"
                        });
                    }
                    return res.json({
                        code: 0,
                        msg: "更新成功"
                    });
                })
            }
        } catch {
            info('error', '服务器错误:' + err);
            res.json({
                code: 1,
                msg: "服务器错误"
            });
        }
    }
    insertServer(req, res) {
        try {
            if (req.session.admin) {
                const { name, plugin, filepath, email_verify, serverip } = req.body;
                this.exServers.insertServer(name, plugin, filepath, email_verify, serverip, (err, row) => {
                    if (err) {
                        info('error', '数据库错误:' + err);
                        return res.json({
                            code: 1,
                            msg: "数据库错误"
                        });
                    }
                    return res.json({
                        code: 0,
                        msg: "插入成功"
                    });
                })
            }
        } catch {
            info('error', '服务器错误:' + err);
            res.json({
                code: 1,
                msg: "服务器错误"
            });
        }
    }
    delServer(req, res) {
        try {
            if (req.session.admin) {
                const { id } = req.body;
                this.exServers.deleteServer(id, (err, row) => {
                    if (err) {
                        info('error', '数据库错误:' + err);
                        return res.json({
                            code: 1,
                            msg: "数据库错误"
                        });
                    }
                    return res.json({
                        code: 0,
                        msg: "删除成功"
                    });
                })
            }
        } catch {
            info('error', '服务器错误:' + err);
            res.json({
                code: 1,
                msg: "服务器错误"
            });
        }
    }
}

module.exports = Admin;