function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

module.exports = function info(type, message) {
    let typeColor = {
        "info": "90",
        "warn": "33",
        "error": "31"
    }
    console.log(`[${formatTime(new Date())}]\x1b[${typeColor[type]}m[${type.toUpperCase()}]\x1b[0m${message}`);
}