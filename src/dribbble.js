import { configLog } from "./config/log4js";
import { insertManyDataToDB, removeDuplicateArray } from "./controllers/crawlController";
import mongoose from "mongoose";

const logger = configLog.getLogger();


export const dribbble = async (browser, url)=> new Promise(async(resolve, reject)=>{
    try {
        let data = []; // Mảng lưu thông tin user crawl được
        let page = await browser.newPage()
        logger.info(">>> Mở Tab mới....")
        await page.goto(url)
        logger.info(">>> Truy cập vào", url)
        await page.waitForSelector('#main-container')
        const email = await page.waitForSelector('#login')
        await email.type('duyphi456@gmail.com', {delay: 30});
        const password = await page.waitForSelector('#password')
        await password.type('lienminh_123', {delay: 30});
        await password.press('Enter');
        logger.info(">>> Đăng nhập thành công vào website...")

        await page.waitForSelector('#home')
        logger.info(">>> Website đã load xong...")
        const buttonSearch = await page.waitForSelector('.nav-v2-search-btn')
        await buttonSearch.press('Enter');
        const searchInput = await page.waitForSelector('#search')
        await searchInput.type('illustration', {delay: 50}); // illustration fawuhvasaxxă8s454d7asd4aqqa
        await searchInput.press('Enter');
        logger.info(">>> Đã search xong yêu cầu...")
        await page.waitForSelector('#wrap-inner')
        await page.waitForSelector('.js-thumbnail-grid > li')

        const scrollToEnd = async () => {
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
    
            await page.waitForTimeout(800); 
        };

        let nameLinkList = []

        let hasNextPage = true;
        do {
            await page.waitForSelector('.js-thumbnail-grid')
            nameLinkList = await page.$$eval(
                '.js-thumbnail-grid > li',
                (infos => infos.map(info => {
                    const link = info.querySelector('.shot-details-container > div > a');
                    if(link === null || typeof link === 'undefined' || typeof link.href === 'undefined'){
                        console.log("<<<<< Lỗi thông tin danh sách User")
                    }else{
                        return {
                            link: link.href
                        };
                    }
                        
                }))
            );
            console.log(">>> Scroll Để Lấy Thông Tin:", nameLinkList.length)
            const checkLoading = await page.$('.null-message')
            if (checkLoading != null) { 
                hasNextPage = false;
            } else {
                await page.waitForSelector('.js-thumbnail-grid > li') // lấy lại toàn bộ data sau khi scroll
                const buttonLoading = await page.$('.infinite > a.load-more') // select button loading
                if(buttonLoading){
                    const buttonLoadingClick = await page.$eval('.infinite', e => e.style.display)  
                    if(buttonLoadingClick.trim() != "none"){
                        await page.$eval('.infinite > a.load-more', e => e.click())
                    }
                }
                await scrollToEnd();
            }
        } while (hasNextPage);

        console.log(">>> Đã lấy xong Info User...")
        
        let page2 = await browser.newPage()
        let biographys = ""
        if(!hasNextPage){
            console.log(">>> Mở Tab mới Info User...")
            for (const {link} of nameLinkList) {
                await Promise.all([
                    page2.waitForNavigation(),
                    page2.goto(`${link}/about`),
                    // page2.waitForSelector('#wrap-inner'),
                ]);
                const checkPage404 = await page2.$('.message-404')
                if(checkPage404 == null){
                const selectBio = await page2.$('.bio');
                const element1 = await page2.$('.location > span');
                const element2 = await page2.$('.pro > span');
                const element3 = await page2.$('.created > span');
                const element4 = await page2.$('.masthead-profile-name');

                if(selectBio === null){
                    biographys = "Không có Data"
                }else{
                    biographys = await page2.$eval('.bio', e => e.textContent)
                }

                let location_User = ""
                let dribbblePro_User = ""
                let created_User = ""
                let name_User = ""

                if (element2 === null) {
                    dribbblePro_User = "Không Có Data"
                    location_User = await page2.$eval('.location > span', e => e.textContent)
                    created_User = await page2.$eval('.created > span', e => e.textContent) 
                    name_User = await page2.$eval('.masthead-profile-name', e => e.textContent) 
                    // console.log(`<<< Không lấy được dribbblePro của: ${name_User}`)
                }else if(element1 === null){
                    location_User = "Không Có Data"
                    dribbblePro_User = await page2.$eval('.pro > span', e => e.textContent) 
                    created_User = await page2.$eval('.created > span', e => e.textContent) 
                    name_User = await page2.$eval('.masthead-profile-name', e => e.textContent)
                    console.log(`<<< Không lấy được Location của: ${name_User}`)
                }else if(element3 === null){
                    created_User = "Không Có Data"
                    location_User = await page2.$eval('.location > span', e => e.textContent) 
                    dribbblePro_User = await page2.$eval('.pro > span', e => e.textContent) 
                    name_User = await page2.$eval('.masthead-profile-name', e => e.textContent) 
                    console.log(`<<< Không lấy được Created của: ${name_User}`)
                }else if(element4 === null){
                    name_User = "Không Có Data"
                    location_User = await page2.$eval('.location > span', e => e.textContent) 
                    dribbblePro_User = await page2.$eval('.pro > span', e => e.textContent) 
                    created_User = await page2.$eval('.created > span', e => e.textContent) 
                    console.log(`<<< Không lấy được Tên của: ${name_User}`)
                }else{
                    location_User = await page2.$eval('.location > span', e => e.textContent) 
                    dribbblePro_User = await page2.$eval('.pro > span', e => e.textContent) 
                    created_User = await page2.$eval('.created > span', e => e.textContent) 
                    name_User = await page2.$eval('.masthead-profile-name', e => e.textContent) 
                }

                const social_TagUL = await page2.$('.social-links-list');
                let socialData = []

                if(social_TagUL !== null){
                    await page2.waitForSelector('.social-links-list')
                    socialData = await page2.$$eval(
                        '.social-links-list > li',
                        (socials => socials.map(social => {
                            const typeSocial = social.querySelector('a');
                            const textDataSocial = social.querySelector('a > span');
                            if(typeSocial === null || typeof typeSocial === 'undefined' || typeSocial.getAttribute("data-social") === null || textDataSocial === null || typeof textDataSocial === 'undefined' || typeof textDataSocial.innerText === 'undefined'){
                                console.log("<<< Lỗi thông tin danh sách User")
                            }else{
                                return {
                                    typeSocial: typeSocial.getAttribute("data-social"),
                                    hrefSocial: typeSocial.href,
                                    textDataSocial: textDataSocial.innerText
                                };
                            }
                                
                        }))
                    );
                }else{
                    console.log(`<<< Không Tìm Thấy Social Của: ${name_User}`)
                    socialData = { notFound: "Không Có Social" }
                }
                
                data.push({
                    name: name_User.trim(),
                    link: link,
                    socials: socialData,
                    information: {
                        biographys: biographys,
                        location: location_User,
                        dribbblePro: dribbblePro_User.trim(),
                        created: created_User
                    },
                })
                logger.info(`>>> Data Thêm Vào Mảng: ${data.length} / ${nameLinkList.length}`)
                console.log(`>>> Data Thêm Vào Mảng: ${data.length} / ${nameLinkList.length}`)
                }else{
                    logger.info(`<<< Không lấy được thông tin của của: ${link}`)
                    console.log(`<<< Không lấy được thông tin của của: ${link}`)
                }
            }
        }
        logger.info(">>> Dữ liệu đang chứa trong mảng:",data.length)
        console.log(">>> Dữ liệu đang chứa trong mảng:",data.length)
        
        logger.info(">>> Bắt đầu lọc tên User giống nhau...")
        console.log(">>> Bắt đầu lọc tên User giống nhau...")
        const dataRemoveDuplicate = await removeDuplicateArray(data)
        logger.info(">>> Lọc thành công tên User giống nhau...")
        console.log(">>> Lọc thành công tên User giống nhau...")
        // Thêm Dữ Liệu Vào Database
        logger.info(">>> Bắt đầu thêm dữ liệu vào Database...")
        console.log(">>> Bắt đầu thêm dữ liệu vào Database...")
        await insertManyDataToDB(dataRemoveDuplicate, mongoose.connection)
        .then(() => {
            logger.info('Thực hiện thêm dữ liệu thành công!');
            console.log('Thực hiện thêm dữ liệu thành công!');
          })
          .catch((err) => {
            logger.error('Lỗi khi thêm dữ liệu:', err);
            console.log('Lỗi khi thêm dữ liệu:', err);
          });
          logger.info(">>> Đã thực hiện xong...")
          console.log(">>> Đã thực hiện xong...")
        // await browser.close()
        resolve()

    } catch (error) {
        logger.error("Lỗi ở scrape",error);
        console.log("Lỗi ở scrape",error);
        reject(error)
    }
}) 
