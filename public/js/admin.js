const deleteProduct = btn => {
    const prodId = btn.parentNode.querySelector('[name=productId]').value;

    fetch('/admin/products/' + prodId, {
        method: 'DELETE'
    }).then(result => {
        return result.json();
    }).then(data => {
        console.log(data);
        if (data.success) {
            // Xoa san pham tren giao dien
            const product = btn.closest('article');
            product.parentNode.removeChild(product);
        } else {
            alert('Deleting product failed!');
        }
    }).catch(err => {
        console.log(err);
    });
}