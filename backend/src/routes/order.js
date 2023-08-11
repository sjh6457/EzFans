import Router from 'express-promise-router';
import { query } from '../db';

const router = new Router();

router.get('/:phone/:id', async (req, res) => {
  const { phone, id } = req.params;
  const { rows } = await query('SELECT id, name, address, email, phone, directions FROM orders WHERE phone = $1 AND id = $2', [phone, id]);
  if (rows.length === 0) {
    res.sendStatus(404);
    return;
  }
  res.send(rows[0]);
});

router.post('/', async (req, res) => {
  const { body } = req;
  if (body.name === undefined || body.stop === undefined || body.phone === undefined || body.ticknum === undefined) {
    res.sendStatus(400);
  } else {
    var availablegates = await query('SELECT id FROM gates WHERE capacity >= $1', [body.ticknum])
    var stopcapacity = await query('SELECT capacity FROM stops WHERE id = $1', [body.stop])
    if (availablegates.rows.length === 0) {
      res.send('We are sold out of tickets! Sorry!')
      return
    }
    if (stopcapacity.rows[0].capacity - body.ticknum < 0){
      res.send('We do not have enough space for your order at the specified stop, please try another stop (the stops show the capacity remaining when clicked on)')
    }
    let gate = availablegates.rows[0]
    await query('UPDATE gates SET capacity = capacity - $1 WHERE id = $2', [body.ticknum, gate.id])
    let stoplist = await query('SELECT transport_id, name FROM stops WHERE id = $1', [body.stop])
    let stop = stoplist.rows[0]
    let transp = await query('SELECT name FROM transports WHERE id = $1', [stop.transport_id])
    let transport = transp.rows[0].name
    let directions = `<br>You need to use stop: <b><i>${stop.name}</i></b>, <br> Take the transport: <b><i>${transport}</i></b>  to the stadium,<br> Then use gate <b><i>${gate.id}</i></b>  to enter.`
    await query('UPDATE stops SET capacity = capacity - $1 WHERE id = $2', [body.ticknum, body.stop])
    await query('INSERT INTO orders (name, stop, phone, gate, directions, ticknum) VALUES ($1, $2, $3, $4, $5, $6)', [body.name, body.stop, body.phone, gate.id, directions, body.ticknum]);
    let response = await query('SELECT id FROM orders WHERE name = $1 AND phone = $2 AND gate = $3 AND ticknum = $4', [body.name, body.phone, gate.id, body.ticknum])
    let order = response.rows[0]
    if (response) {
      res.send('this is your order: ' + order.id + '<br>these are your directions: ' + directions);
    }
    else {
      res.sendStatus(404);
    }
  }
});

router.post('/:phone/:address', async (req, res) => {
  const { body } = req;
  await query('UPDATE orders SET address = $1 WHERE phone = $2', [body.address, body.phone]);
  res.sendStatus(200);
});


export { router as default };
