const mongoose = require('mongoose');
require("dotenv").config();

const { MONGODB_URL } = process.env;

exports.connect = () => {
    mongoose.connect(MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("DB connected successfully"))
    .catch( (error) => {
        console.log("DB connection failed");
        console.error(error);
        process.exit(1);
    })
};