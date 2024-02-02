import https from 'https'
import fs from 'fs'
import path from 'path'
import { configLog } from "../config/log4js";
import Crawls from "../models/dataUser";
import CrawlsVecteezy from "../models/dataUserVecteezy"
const logger = configLog.getLogger();

export const insertManyDataToDB = async (data, dbConnection, typeDatabase) => {
  try {
    if (dbConnection.readyState !== 1) {
      logger.info('Kết nối DB không thành công.');
      console.log('Kết nối DB không thành công.');
      return;
    }

    const count = typeDatabase == "vecteezy" ? await CrawlsVecteezy.countDocuments() : await Crawls.countDocuments()
    logger.info(">>> Dữ liệu sau khi được lọc trùng tên từ Website:", data.length);
    console.log(">>> Dữ liệu sau khi được lọc trùng tên từ Website:", data.length);

    if (count < 5) {
      logger.info('Database có ít hơn 5 bản ghi:', count);
      console.log('Database có ít hơn 5 bản ghi:', count);
      const result = typeDatabase == "vecteezy" ? await CrawlsVecteezy.countDocuments() : await Crawls.insertMany(data);
      logger.info(">>> Đã thêm vào Database", result.length, "bản ghi");
      console.log(">>> Đã thêm vào Database", result.length, "bản ghi");
    } else {
      logger.info('Database có nhiều hơn 5 bản ghi:', count);
      console.log('Database có nhiều hơn 5 bản ghi:', count);
      
      const allData = typeDatabase == "vecteezy" ? await CrawlsVecteezy.find() : await Crawls.find();

      const uniqueNamesSet = new Set();
      const uniqueData = [];

      allData.forEach((item) => {
        if (!uniqueNamesSet.has(item.name)) {
          uniqueNamesSet.add(item.name);
          uniqueData.push(item);
        }
      });

      const newDataFiltered = data.filter((item) => !uniqueNamesSet.has(item.name));
      logger.info(">>> Tiến hành lọc các bản ghi trùng tên nhau.");

      if (newDataFiltered.length > 0) {
        const result = typeDatabase == "vecteezy" ? await CrawlsVecteezy.insertMany(newDataFiltered) : await Crawls.insertMany(newDataFiltered);
        logger.info(">>> Đã thêm vào Database", result.length, "bản ghi mới không trùng name");
      } else {
        logger.info('Không có dữ liệu mới không trùng name để thêm vào.');
      }
    }
  } catch (error) {
    logger.error(error);
    console.log(error);
  }
};

export const removeDuplicateArray = async (data) => {
  try {
    const filteredData = data.reduce((acc, current) => {
      const x = acc.find((item) => item.name == current.name);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);
    return filteredData;
  } catch (error) {
    logger.info("Lọc User",error);
  }
};


export const downloadFileFromUrl = async (url, customPath) => {
  try {
    // Sử dụng customPath nếu được cung cấp, nếu không sử dụng basename của URL
    const filename = customPath ? path.join(customPath, path.basename(url)) : path.basename(url);

    https.get(url, (res) => {
      const fileStream = fs.createWriteStream(filename);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log('Download file ảnh thành công');
      });
    });
  } catch (error) {
    console.log("Error Controller Crawl", error);
    logger.info("Download Error",error);
  }
};