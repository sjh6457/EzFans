import express from 'express';
import chalk from 'chalk';
import {
  createDb, addPostgisToDb, createTables, populateTablesIfEmpty,
} from './db';
import routes from './routes';

const app = express();
app.use(express.json());

// enable CORS without external module
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

async function init() {
  await createDb();
  await addPostgisToDb();
  await createTables();
  await populateTablesIfEmpty();
  routes(app);
}

init();

app.listen(3001, () => {
  console.log(chalk.green('Online Spring School running on 3001!'));
});
