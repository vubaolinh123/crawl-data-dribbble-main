import Dribble from "../models/dataUser";

export const getAll = async (req, res)=>{
    try {
        const limit = req.query.limit * 1 || 12;
        const searchField = req.query.q;
        if (searchField !== undefined) {
          const dribbleSearch = await Dribble.find({
            name: { $regex: searchField, $options: "$i" },
          }).sort({ createdAt: -1 });
    
          return res.json(dribbleSearch);
        }
        const dribble = await Dribble.find().limit(limit).sort({ createdAt: -1 });
        res.json(dribble);
      } catch (error) {
        res.status(400).json({ message: "Không tìm được dribble" });
      }
}