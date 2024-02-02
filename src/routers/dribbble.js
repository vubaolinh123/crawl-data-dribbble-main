import { Router } from 'express';
import { getAll } from '../controllers/dribbble';
const router = Router()



router.get("/dribbble", getAll)


export default router;