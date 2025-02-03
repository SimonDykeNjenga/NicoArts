//-------------------
// GLOBAL DEFINITIONS
//-------------------
const theAdminLogin='nico'
//const theAdminPassword='artsartsarts'
const theAdminPassword= '$2b$12$aHrp/WZVN8MKdidHSB4GUO4qJfO2290JtURbtR6u9.v1srd2cbq6W'

const bcrypt = require ('bcrypt')
//salt rounds for bcrypt algorithm
const saltRounds = 12

// //runn this code only ONCE!
// //copy and paste the hashed password in your code above
// bcrypt.hash(theAdminPassword, saltRounds, function (err, hash){
//     if (err) {
//         console.log("    > error encrypting the password:", err)
//     } else {
//         console.log("--->Hashed password (GENERATE only ONCE):", hash)
//     }
// })


//---------
// PACKAGES
//---------
const sqlite3 = require('sqlite3').verbose();
const {engine} = require ('express-handlebars');
const bodyParser = require ('body-parser');
const express = require('express');
const session=require('express-session')
const connectSqlite3=require('connect-sqlite3')




//------------
// APPLICATION
//------------
const app = express();    
//-----
// PORT
//-----
const port = 3000;        

// SESSIONS
//---------
const SQLiteStore = connectSqlite3(session) // store sessions in the database

app.use(session({ // define the session
    store: new SQLiteStore({db: "sessions-db.db"}),
    "saveUninitialized": false,
    "resave": false,
    "secret": "This123Is@Another#456GreatSecret678%Sentence"
}))

app.use((req, res, next) => {
    if (!req.session) {
        req.session ={};
    }
    if (req.session.isAdmin === undefined) {
        req.session.isAdmin = false;
    }
    if (req.session.isLoggedIn === undefined) {
        req.session.isLoggedIn = false;
    }

    res.locals.isAdmin = req.session && req.session.isAdmin;
    res.locals.isLoggedIn = req.session && req.session.isLoggedIn;
    next();
});





// View Engine
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views')

//MIDDLEWARES
app.use(express.static('public'));  // make everything public in the 'public' directory
// using express middleware for processing forms sent using the "post" method
app.use(bodyParser.urlencoded({ extended: true}));

//*******************************Routes************************************//

app.get('/', function (req, res) { // default route 
    const model = {
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin
    }

    console.log("--->Home model:"+JSON.stringify(model))
    res.render('home.handlebars', model);
})

app.get('/list', (req,res) =>{
    const paintingsQuery = `SELECT * FROM Paintings`;
    const mouldingsQuery = `SELECT * FROM Mouldings`;

    db.all(paintingsQuery, [], (err, paintings) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Database Error');
            return;
        }
        db.all(mouldingsQuery, [], (err, mouldings) => {
            if (err) {
                console.error(err.message);
                res.status(500).send('Database Error');
                return;
            }

            res.render('list', { paintings, mouldings});
    });
});
});


app.get('/paintings/:id', (req,res) =>{
    console.log (`Fetching painting with ID: ${req.params.id}`);
    const paintingId = req.params.id;
    const query = `SELECT * FROM Paintings WHERE id = ?`;


    db.get(query, [paintingId], (err, painting) =>{
        if (err) {
            console.error(`Error fetching painting: ${err.message}`);
            res.status(500).send('Database error');

        } else if (!painting) {
            res.status(404).send('Painting not found!');
        } else {
            console.log(`Fetched Painting data:`, painting);
            res.render('painting-detail', {painting});
        }
    });
});

app.get('/mouldings/:id', (req,res) =>{
    console.log (`Fetching moulding with ID: ${req.params.id}`);
    const mouldingId = req.params.id;
    const query = `SELECT * FROM Mouldings WHERE id = ?`;


    db.get(query, [mouldingId], (err, moulding) =>{
        if (err) {
            console.error(`Error fetching moulding: ${err.message}`);
            res.status(500).send('Database error');

        } else if (!moulding) {
            res.status(404).send('Moulding not found!');
        } else {
            console.log(`Fetched Moulding data:`, moulding);
            res.render('moulding-detail', {moulding});
        }
    });
});

app.get('/contact', (req, res) => {
    res.render('contact.handlebars')
})

app.get('/about', (req,res) =>{
    res.render('about.handlebars')
})

app.get('/login', (req,res) =>{
    res.render('login.handlebars')
})

app.post('/login', (req, res) => {
    console.log("RECEIVED REQUEST: " + JSON.stringify(req.body));

    const {username, password} = req.body;
  

   
    
    if (username == theAdminLogin) {
        console.log('The username is the admin one!')
        bcrypt.compare(password, theAdminPassword, (err, result) => {
            if (err) {
                console.error("Error during password comparison:", err);
                return res.status(500).send("Server error during login");
            }
        
            if (result) {
                console.log('The password is correct!');
                // SESSIONS
                req.session.isAdmin = true;
                req.session.isLoggedIn = true;
                req.session.name = username;
                console.log('Logged in!')

                 //Code generated by ChatGPT - BEGIN
                 //(ChatGPT, 2024, "how to add a message on login with res.redirect",
                 // https://chatgpt.com/)

                req.session.message = "You are the admin. Welcome home!";
                res.redirect('/admin');

                //Code generated by ChatGPT - END

            } else {
                console.log('Incorrect password!');
                req.session.isAdmin = false;
                req.session.isLoggedIn = false;
                const model = { error: "Sorry, the password is not correct...", message: "" };
                return res.status(400).render('login.handlebars', model);
            }
        });
        
    } else {
        //build a model
        const model = { error: "Sorry, the username is not correct!", message: ""}
        //send a response
        return res.status(400).render('login.handlebars',model);
    }
});

function isAuthenticated(req, res, next) {
    if (req.session && req.session.isAdmin) {
        // If the user is logged in and is an admin, proceed to the next middleware/ route
        next();
    } else {
        // If not authenticated, redirect to the login page
        res.redirect('/login');
    }
}


app.get('/admin', isAuthenticated, (req, res) => {
    if (!req.session.isAdmin) {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }

    //Code generated by ChatGPT - BEGIN
    //(ChatGPT, 2024, "how to add a message on login with res.redirect",
    // https://chatgpt.com/)

    const message = req.session.message || ""; // Temporary message
    delete req.session.message; // Clear the message after rendering
    
    //Code generated by ChatGPT - END


    const paintingsQuery = `SELECT * FROM Paintings`;
    const mouldingsQuery = `SELECT * FROM Mouldings`;

    db.all(paintingsQuery, [], (err, paintings) => {
        if (err) {
            console.error('Error fetching paintings:', err.message);
            res.status(500).send('Database Error');
            return;
        }

        db.all(mouldingsQuery, [], (err, mouldings) => {
            if (err) {
                console.error('Error fetching mouldings:', err.message);
                res.status(500).send('Database Error');
                return;
            }

            res.render('admin', {
                isAdmin: req.session.isAdmin,
                isLoggedIn: req.session.isLoggedIn,
                name: req.session.name,
                paintings,
                mouldings
            });
            
        });
    });
});




app.post('/add/:table', isAuthenticated, (req, res) => {
    const table = req.params.table; // Extract table name from the URL
    const { title, artist, price, name, material } = req.body;

    let query = '';
    const params = [];

    // Determine the query and parameters based on the table
    if (table === 'paintings') {
        query = `INSERT INTO Paintings (title, artist, price) VALUES (?, ?, ?)`;
        params.push(title, artist, price);
    } else if (table === 'mouldings') {
        query = `INSERT INTO Mouldings (name, material, price) VALUES (?, ?, ?)`;
        params.push(name, material, price);
    } else {
        return res.status(400).send('Invalid table name'); // Error for invalid table
    }

    // Execute the query
    db.run(query, params, (err) => {
        if (err) {
            console.error(`Error adding to ${table}:`, err.message);
            return res.status(500).send('Database Error');
        }
        res.redirect('/admin'); // Redirect back to admin page
    });
});

app.get('/delete/:table/:id', isAuthenticated, (req, res) => {
    const table = req.params.table; // Extract table name from the URL
    const id = req.params.id; // Extract the item ID from the URL

    let query = '';

    // Determine the query based on the table
    if (table === 'paintings') {
        query = `DELETE FROM Paintings WHERE id = ?`;
    } else if (table === 'mouldings') {
        query = `DELETE FROM Mouldings WHERE id = ?`;
    } else {
        return res.status(400).send('Invalid table name'); // Error for invalid table
    }

    // Execute the query
    db.run(query, [id], (err) => {
        if (err) {
            console.error(`Error deleting from ${table}:`, err.message);
            return res.status(500).send('Database Error');
        }
        res.redirect('/admin'); // Redirect back to admin page
    });
});

app.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Could not log out');
        }
        // Redirect to home page
        console.log('Logged out....')
        res.redirect('/'); 
    })
})





//listen

app.listen(port, () => {
    console.log(`Server is up and running on ${port}`);
});

//**************************setup database*****************************//


const db = new sqlite3.Database('./art.db');


//Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS Paintings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT
        )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS Mouldings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            material TEXT NOT NULL,
            price REAL NOT NULL,
            description TEXT
            )
            `);

    db.run(`INSERT INTO Paintings (title, artist, price)
        SELECT 'Sunset Glow', 'Adisa Leah', 150.0
        WHERE NOT EXISTS (SELECT 1 FROM Paintings WHERE title = 'Sunset Glow')
        `);

    db.run(`INSERT INTO Paintings (title, artist, price)
        SELECT 'Modern Abstract', 'Adisa Leah', 200.0
        WHERE NOT EXISTS (SELECT 1 FROM Paintings WHERE title = 'Modern Abstract')
        `);

    db.run(`INSERT INTO Paintings (title, artist, price)
        SELECT 'Serenity', 'Adisa Leah', 300.0
        WHERE NOT EXISTS (SELECT 1 FROM Paintings WHERE title = 'Serenity')
        `);

    db.run(`INSERT INTO Paintings (title, artist, price)
            SELECT 'Mountain View', 'Adisa Leah', 120.0
            WHERE NOT EXISTS (SELECT 1 FROM Paintings WHERE title = 'Mountain View')
        `);

    db.run(`INSERT INTO Paintings (title, artist, price)
            SELECT 'Bald Eagle', 'Simon Dyke', 250.0
            WHERE NOT EXISTS (SELECT 1 FROM Paintings WHERE title = 'Bald Eagle')
        `);
        
        
        
        db.run(`INSERT INTO Mouldings (name, material, price)
            SELECT 'Resin Clock- Yin yang', 'resin', 50.0
            WHERE NOT EXISTS (SELECT 1 FROM Mouldings WHERE name = 'Resin Clock- Yin yang')
            `);
    
        db.run(`INSERT INTO Mouldings (name, material, price)
            SELECT 'Resin Clock- Waves', 'resin', 180.0
            WHERE NOT EXISTS (SELECT 1 FROM Mouldings WHERE name = 'Resin Clock- Waves')
            `);
    
        db.run(`INSERT INTO Mouldings (name, material, price)
            SELECT 'Flower Vase', 'epoxy', 120.0
            WHERE NOT EXISTS (SELECT 1 FROM Mouldings WHERE name = 'Flower Vase')
            `);
    
        db.run(`INSERT INTO Mouldings (name, material, price)
                SELECT 'Coaster', 'epoxy', 50.0
                WHERE NOT EXISTS (SELECT 1 FROM Mouldings WHERE name = 'Coaster')
            `);
    
        db.run(`INSERT INTO Mouldings (name, material, price)
                SELECT 'Pink Key-holder', 'hardened epoxy', 250.0
                WHERE NOT EXISTS (SELECT 1 FROM Mouldings WHERE name = 'Pink Key-holder')
            `);     
        


    console.log('Database created and populated. Tables are ready for use');
});

//Update tables
db.serialize(() => {
    db.run(`UPDATE Paintings SET description = 'A beautiful sunset painting.' WHERE title = 'Sunset Glow'`);
    db.run(`UPDATE Paintings SET description = 'An abstract masterpiece.' WHERE title = 'Modern Abstract'`);
    db.run(`UPDATE Paintings SET description = 'Serene landscapes and calming colors.' WHERE title = 'Serenity'`);
    db.run(`UPDATE Paintings SET description = 'On top of the worls, touching the clouds.' WHERE title = 'Mountain View'`);
    db.run(`UPDATE Paintings SET description = 'The great bald eagle gracefully soaring over the horizon.' WHERE title = 'Bald Eagle'`);


    db.run(`UPDATE Mouldings SET description = 'Elegant resin clock with a yin-yang design.' WHERE name = 'Resin Clock- Yin yang'`);
    db.run(`UPDATE Mouldings SET description = 'Waves-inspired resin clock.' WHERE name = 'Resin Clock- Waves'`);
    db.run(`UPDATE Mouldings SET description = 'Flowers stand out when placed in a lovely vase' WHERE name = 'Flower Vase'`);
    db.run(`UPDATE Mouldings SET description = 'A beautiful place to place your chilly drink.' WHERE name = 'Coaster'`);
    db.run(`UPDATE Mouldings SET description = 'Keys have never looked more interesting than on a sparkling pink Key holder.' WHERE name = 'Pink Key-holder'`);
});


//********************************************************************************************************/


