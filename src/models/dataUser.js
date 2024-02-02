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
    socials: [{}],
    information: {
        biographys: String,
        location: String,
        dribbblePro: String,
        created: String,
    },
}, { timestamps: new Date() });


const Crawls = mongoose.model('Dribbble', crawlSchema);


export default Crawls;