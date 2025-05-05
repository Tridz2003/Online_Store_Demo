const mongoose = require('mongoose')

const Schema = mongoose.Schema

const orderSchema = new Schema({
    products: [{quantity: {type: Number, required: true}, product: {type: Object, required: true}}],
    user: {
        email: {
            type: String,
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    }
})

module.exports = mongoose.model('Order', orderSchema)