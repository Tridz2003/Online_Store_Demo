const fs = require('fs');

const deleteFile = (path) => {
    fs.unlink(path, (err) => {
        if (err) {
            console.error('Không thể xóa file:', err.message); // Ghi log lỗi
            return; // Thoát mà không ném lỗi
        }
        console.log('Đã xóa file thành công:', path); // Ghi log khi thành công
    });
}

exports.deleteFile = deleteFile;