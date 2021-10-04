module.exports = {
    titleCase(text) {
        let parts = text.replace(/[^A-Za-z0-9 ]/g, " ").split(' ');
        return parts.reduce((acc, n) => {
            if (!n) return acc;
            if (!acc) return n.toLowerCase();
            return acc + n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
        }, undefined);
    }
}