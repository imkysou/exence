const { createCanvas, loadImage } = require('canvas');
const crypto = require('crypto');

class CaptchaGenerator {
    constructor(options = {}) {
        this.options = {
            width: 120,           // 验证码图片宽度
            height: 40,           // 验证码图片高度
            length: 4,            // 验证码字符长度
            fontSize: 30,         // 字体大小
            charPool: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // 字符池（排除易混淆字符）
            干扰线条数: 5,        // 干扰线条数量
            噪点密度: 0.05,       // 噪点密度
            字体样式: 'sans-serif', // 字体样式
            ...options
        };
    }

    /**
     * 生成随机验证码字符串
     */
    generateCode() {
        let code = '';
        const { charPool, length } = this.options;

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charPool.length);
            code += charPool.charAt(randomIndex);
        }

        return code;
    }

    /**
     * 生成验证码图片
     * @param {string} code - 验证码字符串
     */
    async generateImage(code) {
        const { width, height, fontSize, 干扰线条数, 噪点密度, 字体样式 } = this.options;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // 设置背景色（渐变）
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#f9f9f9');
        gradient.addColorStop(1, '#eaeaea');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 绘制干扰线条
        for (let i = 0; i < 干扰线条数; i++) {
            ctx.strokeStyle = this.getRandomColor(80, 160);
            ctx.lineWidth = Math.random() * 2 + 1;
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.bezierCurveTo(
                Math.random() * width, Math.random() * height,
                Math.random() * width, Math.random() * height,
                Math.random() * width, Math.random() * height
            );
            ctx.stroke();
        }

        // 添加噪点
        for (let i = 0; i < width * height * 噪点密度; i++) {
            ctx.fillStyle = this.getRandomColor(100, 200);
            ctx.fillRect(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 2,
                Math.random() * 2
            );
        }

        // 绘制验证码字符
        const chars = code.split('');
        const charWidth = width / (chars.length + 1);

        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            const x = (i + 0.8) * charWidth;
            const y = height / 2 + Math.random() * 8 - 4;

            // 设置随机字体颜色
            ctx.fillStyle = this.getRandomColor(20, 100);

            // 设置随机字体大小和旋转角度
            const size = fontSize + Math.random() * 8 - 4;
            ctx.font = `${size}px ${字体样式}`;
            ctx.textBaseline = 'middle';

            // 随机旋转角度（正负15度）
            const angle = (Math.random() * 30 - 15) * Math.PI / 180;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillText(char, 0, 0);
            ctx.restore();
        }

        // 返回图片Buffer
        return canvas.toBuffer('image/png');
    }

    /**
     * 获取随机颜色
     * @param {number} min - 最小亮度
     * @param {number} max - 最大亮度
     */
    getRandomColor(min, max) {
        const r = Math.floor(Math.random() * (max - min) + min);
        const g = Math.floor(Math.random() * (max - min) + min);
        const b = Math.floor(Math.random() * (max - min) + min);
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * 生成验证码（包含图片和哈希值）
     */
    async generate() {
        const code = this.generateCode();
        const imageBuffer = await this.generateImage(code);

        // 创建哈希值（用于验证）
        const secret = crypto.randomBytes(16).toString('hex'); // 会话密钥
        const hash = crypto.createHmac('sha256', secret)
            .update(code.toLowerCase())
            .digest('hex');

        return {
            image: imageBuffer,
            secret,
            hash
        };
    }

    /**
     * 验证用户输入的验证码
     * @param {string} userInput - 用户输入的验证码
     * @param {string} secret - 会话密钥
     * @param {string} originalHash - 原始哈希值
     */
    verify(userInput, secret, originalHash) {
        if (!userInput || !secret || !originalHash) {
            return false;
        }

        const userHash = crypto.createHmac('sha256', secret)
            .update(userInput.toLowerCase())
            .digest('hex');

        return userHash === originalHash;
    }
}

module.exports = CaptchaGenerator;  