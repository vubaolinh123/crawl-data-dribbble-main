import { dribbble } from "../dribbble"
import { scrapeTwitter } from "../twitter"
import { scrapeVecteezy } from "../vecteezy"

const scrapeControllers = async (browseInstance)=>{
    const urlDribbble = "https://dribbble.com/session/new"
    const urlTwitter = "https://twitter.com/"
    const urlVecteezy = "https://www.vecteezy.com"
    try {
        let browse = await browseInstance
        // dribbble(browse, urlDribbble) // Chạy Tool Dribble
        // scrapeTwitter(browse, urlTwitter) // Chạy Tool Twitter
        scrapeVecteezy(browse, urlVecteezy) // Chạy Tool Vecteezy

    } catch (error) {
        console.log("Lỗi ở scrape controller",error)
    }
}

export default scrapeControllers