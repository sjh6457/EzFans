import Router from 'express-promise-router';
import { query } from '../db';

const router = new Router();

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT id, name, address, stop, phone, directions, gate, preference, ticknum FROM orders');
  res.send(rows);
});

export { router as default };
