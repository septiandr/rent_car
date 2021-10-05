const http = require('http');
const path = require('path');
const express = require('express');
const hbs = require('hbs');
const session = require('express-session');

const app = express();

const dbConnection = require('./connection/db');
const uploadFile = require('./middlewares/uploadFile');
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'hbs');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

hbs.registerPartials(__dirname + '/views/partials');
var pathFile = 'http://localhost:3000/uploads/';
app.use(
    session({
        cookie: {
            maxAge: 1000 * 60 * 60 * 2,
        },
        store: new session.MemoryStore(),
        resave: false,
        saveUninitialized: true,
        secret: 'SangatRahasia',
    })
);
const isLogin = false;
app.use(function(req, res, next) {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});

app.get('/', function(request, response) {
    const title = 'Car';

    const query = 'SELECT * FROM tb_car ORDER BY id DESC';

    dbConnection.getConnection(function(err, conn) {
        if (err) throw err;
        conn.query(query, function(err, results) {
            if (err) throw err;

            let car = [];

            for (var result of results) {
                car.push({
                    id: result.id,
                    name: result.name,
                    plat_number: result.plat_number,
                    price: result.price,
                    photo: pathFile + result.photo,
                    status: result.status,
                });

            }

            response.render('index', {
                title,
                isLogin: request.session.isLogin,
                car,
            });
        });
    });
});

app.get('/indexAdm', function(request, response) {
    const title = 'Car';

    const query = 'SELECT * FROM tb_car ORDER BY id DESC';

    dbConnection.getConnection(function(err, conn) {
        if (err) throw err;
        conn.query(query, function(err, results) {
            if (err) throw err;

            let car = [];

            for (var result of results) {
                car.push({
                    id: result.id,
                    name: result.name,
                    plat_number: result.plat_number,
                    price: result.price,
                    photo: pathFile + result.photo,
                    status: result.status,
                });

            }

            response.render('indexAdm', {
                title,
                isLogin: request.session.isLogin,
                car,
            });
        });
    });
});

app.get('/register', function(request, response) {
    const title = 'Register';
    response.render('register', {
        title,
        isLogin,
    });
});

app.get('/login', function(request, response) {
    const title = 'Login';
    response.render('login', {
        title,
        isLogin,
    });

});

app.get('/addCar', function(request, response) {
    const title = 'Add Car';
    response.render('addCar', {
        title,
        isLogin: request.session.isLogin,
    });

});

app.get('/rent/:id', function(request, response) {
    const title = 'Rent Car';
    const { id } = request.params;
    response.render('rent', {
        title,
        isLogin: request.session.isLogin,
        id,
    });

});

app.post('/register', function(request, response) {
    const { email, password, name, no_ktp, address, phone, } = request.body;
    if (email == '' || password == '') {
        request.session.message = {
            type: 'danger',
            message: 'Please insert all field!',
        };
        return response.redirect('/login');
    }

    const query = `INSERT INTO tb_user (email,password,no_ktp,name, address,phone,status) VALUES("${email}","${password}","${no_ktp}","${name}","${address}","${phone}","0");`;

    dbConnection.getConnection(function(err, conn) {
        if (err) throw err;
        conn.query(query, function(err, results) {
            if (err) throw err;

            request.session.message = {
                type: 'success',
                message: 'Register has successfully!',
            };
            response.redirect('/');
        });
    });
});

app.post('/login', function(request, response) {
    const { email, password } = request.body;

    if (email == '' || password == '') {
        request.session.message = {
            type: 'danger',
            message: 'Please insert all field!',
        };
        return response.redirect('/login');
    }

    const query = `SELECT * FROM tb_user WHERE email = "${email}" AND password = "${password}"`;

    dbConnection.getConnection(function(err, conn) {
        if (err) throw err;
        conn.query(query, function(err, results) {
            if (err) throw err;

            if (results.length == 0) {
                request.session.message = {
                    type: 'danger',
                    message: 'Email and password dont match!',
                };
                response.redirect('/login');
            } else {
                request.session.message = {
                    type: 'success',
                    message: 'Login has successfully!',
                };
                console.log(results)
                request.session.isLogin = true;
                if (results[0].status == 0) {
                    response.redirect('/indexAdm');
                } else {
                    request.session.user = {
                        id: results[0].id,
                        email: results[0].email,
                        name: results[0].name,
                        status: results[0].status,
                    };
                    response.redirect('/');
                }

            }
        });
    });
});

app.post('/addCar', uploadFile('photo'), function(request, response) {
    var { name, plat_number, price, status, brand, type } = request.body;
    var photo = '';

    if (request.file) {
        photo = request.file.filename;
    }
    if (name == '' || plat_number == '' || price == '') {
        request.session.message = {
            type: 'danger',
            message: 'Please insert all field!',
        };
        return response.redirect('/login');
    }

    const query = `INSERT INTO tb_car(name,plat_number,price,photo,status,brand_id,type_id) VALUES ("${name}","${plat_number}","${price}","${photo}","${status}",${brand},${type});`;

    dbConnection.getConnection(function(err, conn) {
        console.log(brand);
        if (err) throw err;
        conn.query(query, function(err, results) {
            if (err) throw err;
            request.session.message = {
                type: 'success',
                message: 'add car has successfully!',
            };
            response.redirect('/addCar');
        });
    });
});

app.post('/rent', function(request, response) {

    const { id, borrow_date, return_date, sub_total, } = request.body;
    console.log(id)
    const user_id = request.session.user.id;


    const query = `INSERT INTO tb_rent (borrow_date,return_date,sub_total,car_id,user_id) VALUES("${borrow_date}","${return_date}","${sub_total}",${id},${user_id});`;
    console.log(query);
    dbConnection.getConnection(function(err, conn) {
        if (err) throw err;
        conn.query(query, function(err, results) {
            if (err) throw err;
            response.redirect('/profile');
        });
    });
});

app.get('/editCar/:id', function(request, response) {
    const title = 'Edit Car';
    const { id } = request.params;

    const query = `SELECT * FROM tb_car WHERE id = ${id}`;

    dbConnection.getConnection(function(err, conn) {
        if (err) throw err;
        conn.query(query, function(err, results) {
            if (err) throw err;

            const car = {
                ...results[0],
                photo: pathFile + results[0].photo,

            };

            response.render('editCar', {
                title,
                isLogin: request.session.isLogin,
                car,
            });
        });
    });
});

app.post('/editCar', uploadFile('photo'), function(request, response) {
    var { id, name, plat_number, price, photo, status, type, brand, oldImage } = request.body;
    console.log(id)
    var photo = oldImage.replace(pathFile, '');

    if (request.file) {
        image = request.file.filename;
    }

    const query = `UPDATE tb_car SET photo = "${photo}", name = "${name}", plat_number = "${plat_number}", price = "${price}", status = "${status}", brand_id = ${brand}, type_id = ${type} WHERE id = ${id}`;

    dbConnection.getConnection(function(err, conn) {
        console.log(query);
        if (err) throw err;
        conn.query(query, function(err, results) {
            if (err) throw err;

            response.redirect(`/`);
        });
    });
});
app.get('/deleteCar/:id', function(request, response) {
    const { id } = request.params;
    const query = `DELETE FROM tb_car WHERE id = ${id}`;

    dbConnection.getConnection(function(err, conn) {
        if (err) throw err;
        conn.query(query, function(err, results) {
            if (err) throw err;
            response.redirect('/');
        });
    });
});

app.get('/profile', function(request, response) {
    const title = 'Car';

    const query = 'SELECT * FROM tb_rent ORDER BY id DESC';

    dbConnection.getConnection(function(err, conn) {
        if (err) throw err;
        conn.query(query, function(err, results) {
            if (err) throw err;

            let rent = [];

            for (var result of results) {
                rent.push({
                    id: result.id,
                    borrow_date: result.borrow_date,
                    return_date: result.return_date,
                    sub_total: result.sub_total,
                    car_id: result.car_id,
                });

            }

            response.render('profile', {
                title,
                isLogin: request.session.isLogin,
                rent,
            });
        });
    });
});

app.get('/deleteRent/:id', function(request, response) {
    const { id } = request.params;
    const query = `DELETE FROM tb_rent WHERE id = ${id}`;

    dbConnection.getConnection(function(err, conn) {
        if (err) throw err;
        conn.query(query, function(err, results) {
            if (err) throw err;
            response.redirect('/profile');
        });
    });
});

app.get('/logout', function(request, response) {
    request.session.destroy();
    response.redirect('/');
});


const port = 3000;
const server = http.createServer(app);
server.listen(port);
console.debug(`Server listening on port ${port}`);