const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
        items: [{productId: {type: Schema.Types.ObjectId, ref: 'Product', required: true}, quantity: {type: Number, required: true}}]
    }
})

userSchema.methods.addToCart = function(product) {
    const cartProduct = this.cart.items.findIndex(p => { // trả về index đầu tiên
        return product._id.toString() === p.productId.toString()
    })
    let newQuantity = 1;
    const updateItems = [...this.cart.items]
    if(cartProduct >= 0){
        newQuantity = updateItems[cartProduct].quantity + 1;
        updateItems[cartProduct].quantity = newQuantity;
    }else{
        updateItems.push({productId: product._id, quantity: newQuantity})
    }
    this.cart.items = updateItems;
    return this.save();
}

userSchema.methods.deleteItemFromCart = function(prodId){
    const updateCartItems = this.cart.items.filter(p => {
        return prodId.toString() !== p.productId.toString();
    })
    this.cart.items = updateCartItems;
    return this.save();
}

userSchema.methods.clearCart = function(){
    this.cart = {items: []}
    return this.save();
}

module.exports = mongoose.model('User', userSchema);