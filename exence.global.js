/**
 * Global Configuration
 */

module.exports = {
    // 网站端口（默认为80）
    "port": "80",
    // 网站主题（请在themes下创建）
    "theme": "simple",
    "ssl": {
        // 如果您为您的网站申请了SSL，请在此处启用
        "enabled": false,
        
        // SSL文件证书及密钥路径（默认/saves/ssl）
        "privateKey": "saves/ssl/private.key",
        "certificate": "saves/ssl/certificate.crt",

        // SSL端口(默认443，不建议调整)
        "port": 443,

        // 强制http转https(启用SSL后有效)
        "force_https": true
    },
    "admin": {
        // 后台访问页面安全路径，建议在使用前进行修改，请勿设置常见单词
        "path": "/exence"
    },
    "remoteIP": {
        // IP获取方式，错误的IP获取方式可能会导致游戏账号注册异常
        // Legacy(直接获取) | Proxy(使用nginx/apache做反代时设置为此) | Header(标头设置，使用Cloudflare建议使用此模式)
        "method": "legacy",

        // IP获取标头名称，仅当method为Header时有效
        "Header": "CF-Connecting-IP",   /**  Cloudflare对应的标头为 CF-Connecting-IP */
    },
    "email_verify": {
        // 启动邮件验证
        "enable": false,

        // 邮件服务器配置
        "host": "",
        "port": 465,
        "secure": true,
        "auth": {
            "user": "",
            "pass": ""
        },

        // 邮件发送者
        "from": "",
    }
}