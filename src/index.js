const path = require('path');
const express = require('express');
const methodOverride = require('method-override');
const { engine } = require('express-handlebars');

const { request } = require('http');
const app = express();
const port = 3000;

const routeUser = require('./routes/user');
const routeAdmin = require('./routes/admin');
const db = require('./config/db');

// Kết nối cơ sở dữ liệu
db.connect();

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resources', 'views'));
app.use(methodOverride('_method'));
app.use(express.json());
routeUser(app);
routeAdmin(app);

app.use(
    express.urlencoded({
        extended: true,
    }),
);

app.engine(
  'hbs',
  engine({
    extname: '.hbs',
  }),
)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});