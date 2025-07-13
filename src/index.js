const path = require('path');
const express = require('express');
const methodOverride = require('method-override');
const { create: handlebarsCreate } = require('express-handlebars');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const SortMiddleware = require('./app/middlewares/SortMiddleware');

const { request } = require('http');
const app = express();
const port = 3000;

const routeUser = require('./routes/user');
const routeAdmin = require('./routes/admin');
const db = require('./config/db');

// Kết nối cơ sở dữ liệu
db.connect().then(() => {
  console.log('Kết nối MongoDB thành công');
}).catch(err => {
  console.error('Lỗi kết nối MongoDB:', err);
  process.exit(1); // Thoát nếu không kết nối được
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
app.use(SortMiddleware);
app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    }),
);

const store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/work_management',
  collection: 'sessions'
});

store.on('error', function(error) {
  console.error('Lỗi bộ lưu trữ session:', error);
});

// Middleware session (không giới hạn cookie, secret mặc định)
app.use(session({
  secret: 'a96c1c64c8d59290a7f946b32e9d59c5b0c02d3e56d19b5b7c7d5d5fa06b8fbd715a86f9ad88a2f06bc21db6d02576f2b4385cb1525fa88e70e5e4a348a14d4d',
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: { secure: false },
}));

const hbs = handlebarsCreate({
    extname: '.hbs',
    helpers: {
        eq: function (a, b) {
            return a === b;
        },
    },
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resources/views'));

routeUser(app);
routeAdmin(app);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});