import express from "express"
import cors from 'cors';
import morgan from "morgan"
import startBrowser from "./browser/browser";
import scrapeControllers from "./controllers/scrapeController";
import mongoose from "mongoose";
import dribbbleRouter from "./routers/dribbble"
require('dotenv').config();

const app = express();

app.use(cors());


app.use(morgan("tiny"))
app.use(express.json());
app.use(express.urlencoded());

// Router
app.use("/api", dribbbleRouter);


// connect db
mongoose.connect("mongodb://magi_crawl:B2yN6B12@45.76.156.10:27017/magi_crawl_db?authSource=admin")
    .then(() => {
        console.log("Kết nối DB thành công");
    })
    .catch(err => console.log(err))

const dbConnection = mongoose.connection;
dbConnection.on("error", (err) => console.log(`Kết nối thất bại ${err}`));
dbConnection.once("open", () => console.log("Kết nối thành công đến DB!"));

// Khởi tạo để chạy Crawl
let browser = startBrowser();
scrapeControllers(browser)

// const testGPT = async () => {
//     const dataGPT4 = await ReadContentTwitterWithGPT4("TWICE in a new photo for their upcoming release, 'I Got You'.", "https://pbs.twimg.com/media/GDaNpsJbYAAElC4?format=jpg&name=small")
//     console.log("dataGPT4", dataGPT4.choices[0].message.content)
//     return dataGPT4
// }

// testGPT().then((data) =>{
//     console.log(data)
// })

const PORT = 8080;
app.listen(PORT, () => {
    console.log("Server của bạn đang chạy ở cổng ", PORT);
})

