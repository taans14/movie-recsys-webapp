import express from 'express';
import * as movieController from './movies.controller.js';

const router = express.Router();

router.get('/search', movieController.search);

router.get('/trending', movieController.getTrending);
router.get('/top-rated', movieController.getTopRated);

router.post('/', movieController.create);
router.get('/', movieController.findAll);
router.get('/:tmdb_id', movieController.findOne);
router.put('/:tmdb_id', movieController.update);
router.delete('/:tmdb_id', movieController.remove);

export default router;