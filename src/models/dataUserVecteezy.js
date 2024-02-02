import mongoose, { Schema } from "mongoose";

const crawlSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    link: {
        type: String,
        required: true
    },
}, { timestamps: new Date() });


const CrawlsVecteezy = mongoose.model('Vecteezy', crawlSchema);


export default CrawlsVecteezy;