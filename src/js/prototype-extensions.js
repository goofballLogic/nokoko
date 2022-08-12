
Number.prototype.leftPad = function (padChar, length) {
    const text = this.toString();
    return text.length < length ? `${padChar.repeat(length - text.length)}${text}` : text;
}
